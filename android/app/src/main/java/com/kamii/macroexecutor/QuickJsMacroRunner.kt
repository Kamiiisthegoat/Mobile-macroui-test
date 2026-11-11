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
            function press(x, y, duration) { host.press(x, y, duration || 50); }
            function tap(x, y) { host.press(x, y, 50); }
            function longPress(x, y, duration) { host.longPress(x, y, duration || 1000); }
            function swipe(x1, y1, x2, y2, duration) { host.swipe(x1, y1, x2, y2, duration || 300); }
            function toast(msg) { host.log("[TOAST] " + msg); }
            function captureScreen() { return { __fake_image: true }; }
            
            // 🔥 FAST 3x3 SCANNER
            function fastMatch3x3(x, y, hex, tolerance) { return host.match3x3(x, y, hex, tolerance); }
            
            const images = { pixel: function(img, x, y) { return host.getPixel(x, y); } };
            const colors = {
                parseColor: function(hex) { hex = hex.replace('#', ''); return (0xFF000000 | parseInt(hex, 16)) | 0; },
                isSimilar: function(c1, c2, threshold) {
                    const r1 = (c1 >> 16) & 0xFF, g1 = (c1 >> 8) & 0xFF, b1 = c1 & 0xFF;
                    const r2 = (c2 >> 16) & 0xFF, g2 = (c2 >> 8) & 0xFF, b2 = c2 & 0xFF;
                    return Math.abs(r1 - r2) <= threshold && Math.abs(g1 - g2) <= threshold && Math.abs(b1 - b2) <= threshold;
                }
            };

            // --- 🔥 FLOATY OVERLAY API ---
            window.overlay = {
                hide: function() { host.overlayHide(); },
                show: function() { host.overlayShow(); },
                setText: function(text) { host.overlayText(String(text)); },
                move: function(x, y) { host.overlayMove(x, y); },
                setColor: function(hex) { host.overlayColor(hex); }
            };

            window.__isArmed = false;
            window.__isFired = false;
            window.onMacroEvent = function(event) {
                if (event === 'arm') { window.__isArmed = true; window.__isFired = false; }
                if (event === 'fire') { window.__isFired = true; }
            };

            async function waitFor(fn, timeoutMs, pollMs) {
                pollMs = pollMs || 50; timeoutMs = timeoutMs || 10000; const start = Date.now();
                while (Date.now() - start < timeoutMs) {
                    if (__cancelled) throw new Error('__cancelled__');
                    let ok = false; try { ok = await Promise.resolve(fn()); } catch (e) { ok = false; }
                    if (ok) return true; await sleep(pollMs);
                }
                throw new Error('waitFor timeout');
            }

            function log(m) { host.log(String(m)); }
            function setStatus(m) { host.log('[status] ' + String(m)); }

            window.sleep    = sleep;
            window.waitFor  = waitFor;
            window.log      = log;
            window.setStatus = setStatus;
            window.__cancel = __cancel;
            
            window.press = press; window.tap = tap; window.longPress = longPress;
            window.swipe = swipe; window.toast = toast; window.captureScreen = captureScreen;
            window.images = images; window.colors = colors;
            window.fastMatch3x3 = fastMatch3x3;
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

    fun sendEvent(event: String) {
        mainHandler.post {
            webView?.evaluateJavascript("if(window.onMacroEvent) window.onMacroEvent('$event');", null)
        }
    }

    private fun injectAndRun(wv: WebView, script: String) {
        if (!running.get()) return
        wv.evaluateJavascript(BOOTSTRAP, null)
        val wrapped = """
            (async () => {
                try { await (async () => { $script })(); } 
                catch (e) {
                    if (e && e.message && String(e.message).indexOf('__cancelled__') >= 0) host.onCancelled();
                    else host.onError(String(e), e && e.stack ? String(e.stack) : '');
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
                // Don't null the listener, just let it be overwritten on the next execute()
            }, 400L)
        }
    }

    class HostBridge {
        @JavascriptInterface fun tap(x: Int, y: Int) { press(x, y, 50) }
        @JavascriptInterface fun press(x: Int, y: Int, durationMs: Int) {
            MacroAccessibilityService.instance?.performTap(x.toFloat(), y.toFloat(), durationMs.toLong())
        }
        @JavascriptInterface fun longPress(x: Int, y: Int, ms: Int) {
            MacroAccessibilityService.instance?.performLongPress(x.toFloat(), y.toFloat(), ms.toLong())
        }
        @JavascriptInterface fun swipe(x1: Int, y1: Int, x2: Int, y2: Int, durationMs: Int) {
            MacroAccessibilityService.instance?.performSwipe(x1.toFloat(), y1.toFloat(), x2.toFloat(), y2.toFloat(), durationMs.toLong())
        }
        @JavascriptInterface fun getPixel(x: Int, y: Int): Int = ScreenCaptureHolder.getPixel(x, y)
        
        // 🔥 NEW
        @JavascriptInterface fun match3x3(x: Int, y: Int, hexColor: String, tolerance: Int): Boolean {
            return try {
                val color = hexColor.removePrefix("#").toLong(16).toInt()
                ScreenCaptureHolder.match3x3(x, y, color, tolerance)
            } catch (_: Exception) { false }
        }
        
        @JavascriptInterface fun overlayHide() { FloatingOverlayService.instance?.setOverlayVisibility(false) }
        @JavascriptInterface fun overlayShow() { FloatingOverlayService.instance?.setOverlayVisibility(true) }
        @JavascriptInterface fun overlayText(text: String) { FloatingOverlayService.instance?.setOverlayText(text) }
        @JavascriptInterface fun overlayMove(x: Int, y: Int) { FloatingOverlayService.instance?.moveOverlay(x, y) }
        @JavascriptInterface fun overlayColor(hex: String) { FloatingOverlayService.instance?.setOverlayDotColor(hex) }

        @JavascriptInterface fun log(msg: String) { mainHandler.post { listener?.onLog(msg) } }
        @JavascriptInterface fun onComplete() { mainHandler.post { if (running.getAndSet(false)) listener?.onCompleted() } }
        @JavascriptInterface fun onCancelled() { mainHandler.post { if (running.getAndSet(false)) listener?.onStopped() } }
        @JavascriptInterface fun onError(message: String, stack: String) { mainHandler.post { if (running.getAndSet(false)) listener?.onError(message, stack.ifBlank { null }) } }
    }
}
