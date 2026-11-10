package com.kamii.macroexecutor

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import java.util.concurrent.atomic.AtomicBoolean

object QuickJsMacroRunner {

    var lastExecutedScript: String? = null

    interface Listener {
        fun onStarted()
        fun onLog(message: String)
        fun onCompleted()
        fun onStopped()
        fun onError(message: String, stack: String?)
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var listener: Listener? = null
    private var webView: WebView? = null
    private val running = AtomicBoolean(false)

    // 🔥 UPDATED: Auto.js Compatibility Layer added
    private val BOOTSTRAP = """
        (function() {
            let __cancelled = false;
            let __cancelReject = null;

            function __cancel() {
                __cancelled = true;
                if (__cancelReject) {
                    const r = __cancelReject;
                    __cancelReject = null;
                    r(new Error('__cancelled__'));
                }
            }

            function sleep(ms) {
                return new Promise((resolve, reject) => {
                    if (__cancelled) return reject(new Error('__cancelled__'));
                    __cancelReject = reject;
                    setTimeout(() => { __cancelReject = null; resolve(); }, ms);
                });
            }

            // --- AUTO.JS COMPATIBILITY LAYER ---
            
            // 1. Native Inputs
            function press(x, y, duration) { host.press(x, y, duration || 50); }
            function tap(x, y) { host.press(x, y, 50); }
            function longPress(x, y, duration) { host.longPress(x, y, duration || 1000); }
            function swipe(x1, y1, x2, y2, duration) { host.swipe(x1, y1, x2, y2, duration || 300); }
            function toast(msg) { host.log("[TOAST] " + msg); }

            // 2. Screen Capture (Simulated for Auto.js compatibility)
            // Auto.js uses image objects. We fake it because our native engine reads pixels live.
            function captureScreen() { return { __fake_image: true }; }
            
            const images = {
                pixel: function(img, x, y) {
                    const packed = host.getPixel(x, y);
                    return packed; // Returns ARGB Integer
                }
            };

            // 3. Colors Module
            const colors = {
                parseColor: function(hex) {
                    // Auto.js returns an ARGB integer
                    hex = hex.replace('#', '');
                    return (0xFF000000 | parseInt(hex, 16)) | 0; 
                },
                isSimilar: function(color1, color2, threshold) {
                    // If they pass ARGB ints, we compare RGB channels
                    const r1 = (color1 >> 16) & 0xFF, g1 = (color1 >> 8) & 0xFF, b1 = color1 & 0xFF;
                    const r2 = (color2 >> 16) & 0xFF, g2 = (color2 >> 8) & 0xFF, b2 = color2 & 0xFF;
                    return Math.abs(r1 - r2) <= threshold && Math.abs(g1 - g2) <= threshold && Math.abs(b1 - b2) <= threshold;
                }
            };

            // 4. Threading (Mapped to standard async/await)
            const threads = {
                start: function(fn) { setTimeout(fn, 0); }
            };
            
            function exit() { throw new Error("Script exited by user"); }

            // --- END COMPATIBILITY LAYER ---

            async function waitFor(fn, timeoutMs, pollMs) {
                pollMs = pollMs || 50;
                timeoutMs = timeoutMs || 10000;
                const start = Date.now();
                while (Date.now() - start < timeoutMs) {
                    if (__cancelled) throw new Error('__cancelled__');
                    let ok = false;
                    try { ok = await Promise.resolve(fn()); } catch (e) { ok = false; }
                    if (ok) return true;
                    await sleep(pollMs);
                }
                throw new Error('waitFor timeout after ' + timeoutMs + 'ms');
            }

            function colorAt(x, y) {
                const packed = host.getPixel(x, y);
                return ('000000' + (packed & 0xFFFFFF).toString(16)).slice(-6).toUpperCase();
            }

            function log(m) { host.log(String(m)); }
            function setStatus(m) { host.log('[status] ' + String(m)); }

            const __origLog   = console.log;
            const __origError = console.error;
            const __origWarn  = console.warn;
            console.log   = function() { host.log(Array.from(arguments).join(' ')); __origLog.apply(console, arguments); };
            console.error = function() { host.log('[error] ' + Array.from(arguments).join(' ')); __origError.apply(console, arguments); };
            console.warn  = function() { host.log('[warn] '  + Array.from(arguments).join(' ')); __origWarn.apply(console, arguments); };

            // Expose everything to the global window object
            window.sleep    = sleep;
            window.waitFor  = waitFor;
            window.log      = log;
            window.setStatus = setStatus;
            window.colorAt  = colorAt;
            window.__cancel = __cancel;
            
            // Auto.js globals
            window.press = press;
            window.tap = tap;
            window.longPress = longPress;
            window.swipe = swipe;
            window.toast = toast;
            window.captureScreen = captureScreen;
            window.images = images;
            window.colors = colors;
            window.threads = threads;
            window.exit = exit;
        })();
    """.trimIndent()

    @SuppressLint("SetJavaScriptEnabled")
    fun execute(context: Context, script: String, listener: Listener) {
        lastExecutedScript = script
        stop(silent = true)
        this.listener = listener
        running.set(true)

        mainHandler.post {
            val wv = WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = false
                settings.allowFileAccess = false
                settings.allowContentAccess = false
                addJavascriptInterface(HostBridge(), "host")
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView, url: String) {
                        injectAndRun(view, script)
                    }
                }
                loadDataWithBaseURL(null, "<html><body></body></html>", "text/html", "UTF-8", null)
            }
            webView = wv
        }
    }

    private fun injectAndRun(wv: WebView, script: String) {
        if (!running.get()) return
        wv.evaluateJavascript(BOOTSTRAP, null)

        val wrapped = """
            (async () => {
                try {
                    await (async () => {
                        $script
                    })();
                } catch (e) {
                    if (e && e.message && String(e.message).indexOf('__cancelled__') >= 0) {
                        host.onCancelled();
                    } else {
                        host.onError(String(e), e && e.stack ? String(e.stack) : '');
                    }
                    return;
                }
                host.onComplete();
            })();
        """.trimIndent()

        wv.evaluateJavascript(wrapped, null)
        mainHandler.post { listener?.onStarted() }
    }

    fun stop(silent: Boolean = false) {
        val wasRunning = running.getAndSet(false)
        if (!wasRunning) return
        if (!silent) mainHandler.post { listener?.onStopped() }
        mainHandler.post {
            webView?.evaluateJavascript("try{__cancel()}catch(e){}", null)
            val wv = webView
            webView = null
            mainHandler.postDelayed({
                runCatching { wv?.destroy() }
                listener = null
            }, 400L)
        }
    }

    class HostBridge {
        @JavascriptInterface
        fun tap(x: Int, y: Int) { press(x, y, 50) }

        @JavascriptInterface
        fun press(x: Int, y: Int, durationMs: Int) {
            val svc = MacroAccessibilityService.instance
            if (svc == null) {
                log("❌ ERROR: Accessibility Service is not connected!")
                return
            }
            val ok = svc.performTap(x.toFloat(), y.toFloat(), durationMs.toLong())
            if (!ok) log("❌ Failed to dispatch press to ($x, $y).")
        }

        @JavascriptInterface
        fun longPress(x: Int, y: Int, ms: Int) {
            MacroAccessibilityService.instance?.performLongPress(x.toFloat(), y.toFloat(), ms.toLong())
        }

        @JavascriptInterface
        fun swipe(x1: Int, y1: Int, x2: Int, y2: Int, durationMs: Int) {
            MacroAccessibilityService.instance?.performSwipe(x1.toFloat(), y1.toFloat(), x2.toFloat(), y2.toFloat(), durationMs.toLong())
        }

        @JavascriptInterface
        fun getPixel(x: Int, y: Int): Int = ScreenCaptureHolder.getPixel(x, y)

        @JavascriptInterface
        fun log(msg: String) { mainHandler.post { listener?.onLog(msg) } }
        @JavascriptInterface
        fun onComplete() { mainHandler.post { if (running.getAndSet(false)) listener?.onCompleted() } }
        @JavascriptInterface
        fun onCancelled() { mainHandler.post { if (running.getAndSet(false)) listener?.onStopped() } }
        @JavascriptInterface
        fun onError(message: String, stack: String) { mainHandler.post { if (running.getAndSet(false)) listener?.onError(message, stack.ifBlank { null }) } }
    }
}
