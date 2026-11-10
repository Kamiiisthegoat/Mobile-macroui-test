package com.kamii.macroexecutor

import android.annotation.SuppressLint
import android.content.Context
import android.os.Handler
import android.os.Looper
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.webkit.WebViewClient
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

object QuickJsMacroRunner {

    private val scope = CoroutineScope(Dispatchers.Main + SupervisorJob())
    private var job: Job? = null
    private var webView: WebView? = null

    @SuppressLint("SetJavaScriptEnabled")
    fun execute(context: Context, script: String) {
        stop()
        job = scope.launch {
            val wv = WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.allowFileAccess = false
                settings.allowContentAccess = false
                webViewClient = WebViewClient()
                addJavascriptInterface(MacroHost(), "host")
                loadDataWithBaseURL(
                    null,
                    "<html><body></body></html>",
                    "text/html",
                    "UTF-8",
                    null
                )
            }
            webView = wv

            wv.postDelayed({
                if (job?.isActive == true) {
                    wv.evaluateJavascript(script, null)
                }
            }, 300L)
        }
    }

    fun stop() {
        job?.cancel()
        job = null
        val wv = webView
        webView = null
        if (wv != null) {
            Handler(Looper.getMainLooper()).post {
                runCatching { wv.destroy() }
            }
        }
    }

    class MacroHost {

        @JavascriptInterface
        fun tap(x: Int, y: Int) {
            MacroAccessibilityService.instance?.performTap(x.toFloat(), y.toFloat(), 50L)
        }

        @JavascriptInterface
        fun longPress(x: Int, y: Int, ms: Int) {
            MacroAccessibilityService.instance
                ?.performLongPress(x.toFloat(), y.toFloat(), ms.toLong())
        }

        @JavascriptInterface
        fun swipe(x1: Int, y1: Int, x2: Int, y2: Int, duration: Int) {
            MacroAccessibilityService.instance?.performSwipe(
                x1.toFloat(),
                y1.toFloat(),
                x2.toFloat(),
                y2.toFloat(),
                duration.toLong()
            )
        }

        @JavascriptInterface
        fun sleep(ms: Int) {
            if (job?.isActive == true) Thread.sleep(ms.toLong())
        }

        @JavascriptInterface
        fun getPixel(x: Int, y: Int): Int = ScreenCaptureHolder.getPixel(x, y)

        @JavascriptInterface
        fun matchPixels(csv: String, tolerance: Int): Boolean {
            val parts = csv.split(",").map { it.trim().toInt() }
            return ScreenCaptureHolder.matchPixels(
                IntArray(parts.size) { parts[it] },
                tolerance
            )
        }

        @JavascriptInterface
        fun findColor(
            x1: Int,
            y1: Int,
            x2: Int,
            y2: Int,
            hex: String,
            tolerance: Int
        ): String {
            val color = hex.removePrefix("#").toLong(16).toInt()
            return ScreenCaptureHolder.findColor(x1, y1, x2, y2, color, tolerance)
                ?.let { "${it.first},${it.second}" } ?: "-1,-1"
        }

        @JavascriptInterface
        fun log(msg: String) = android.util.Log.d("MacroScript", msg)
    }
}
