package com.kamii.macroexecutor

import android.os.SystemClock
import io.github.taoweiji.quickjs.JSContext
import io.github.taoweiji.quickjs.JSObject
import io.github.taoweiji.quickjs.QuickJS
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object QuickJsMacroRunner {

    @Volatile
    private var running = false

    fun isRunning(): Boolean = running

    fun stop() {
        running = false
    }

    suspend fun execute(script: String): String = withContext(Dispatchers.Default) {
        if (running) return@withContext "ERROR: already running"
        running = true

        var runtime: QuickJS? = null
        var context: JSContext? = null

        try {
            runtime = QuickJS.createRuntime()
            context = runtime.createContext()

            val host = JSObject(context)

            // tap(x, y, [durationMs])
            host.registerJavaMethod({ _, args ->
                val x = args.getDouble(0).toFloat()
                val y = args.getDouble(1).toFloat()
                val d = if (args.length() > 2) args.getLong(2) else 50L
                MacroAccessibilityService.instance?.performTap(x, y, d) ?: false
            }, "tap")

            // swipe(x1, y1, x2, y2, durationMs)
            host.registerJavaMethod({ _, args ->
                MacroAccessibilityService.instance?.performSwipe(
                    args.getDouble(0).toFloat(),
                    args.getDouble(1).toFloat(),
                    args.getDouble(2).toFloat(),
                    args.getDouble(3).toFloat(),
                    args.getLong(4)
                ) ?: false
            }, "swipe")

            // sleep(ms) — sliced so stop() takes effect promptly
            host.registerJavaMethod({ _, args ->
                val ms = args.getLong(0)
                var remaining = ms
                while (remaining > 0 && running) {
                    val chunk = minOf(remaining, 50L)
                    SystemClock.sleep(chunk)
                    remaining -= chunk
                }
                running
            }, "sleep")

            // getPixel(x, y) -> ARGB jint
            host.registerJavaMethod({ _, args ->
                val reader = ScreenCaptureHolder.imageReader ?: return@registerJavaMethod 0
                val image = reader.acquireLatestImage() ?: return@registerJavaMethod 0
                try {
                    val plane = image.planes[0]
                    NativePixelEngine.getPixelColor(
                        plane.buffer,
                        image.width,
                        image.height,
                        plane.rowStride,
                        args.getInteger(0),
                        args.getInteger(1)
                    )
                } finally {
                    image.close()
                }
            }, "getPixel")

            // matchPixels(tripletsFlatArray, tolerance) -> Boolean
            host.registerJavaMethod({ _, args ->
                val reader = ScreenCaptureHolder.imageReader ?: return@registerJavaMethod false
                val image = reader.acquireLatestImage() ?: return@registerJavaMethod false
                try {
                    val plane = image.planes[0]
                    val jsArray = args.getObject(0) as? JSObject
                        ?: return@registerJavaMethod false
                    val len = jsArray.get("length").toInt()
                    val triplets = IntArray(len) { i ->
                        jsArray.get(i.toString()).toInt()
                    }
                    val tolerance = args.getInteger(1)
                    NativePixelEngine.matchMultiPixels(
                        plane.buffer,
                        image.width,
                        image.height,
                        plane.rowStride,
                        triplets,
                        tolerance
                    )
                } finally {
                    image.close()
                }
            }, "matchPixels")

            // findColor(x1, y1, x2, y2, argbColor, tolerance) -> packed (x<<16)|y, or -1
            host.registerJavaMethod({ _, args ->
                val reader = ScreenCaptureHolder.imageReader ?: return@registerJavaMethod -1
                val image = reader.acquireLatestImage() ?: return@registerJavaMethod -1
                try {
                    val plane = image.planes[0]
                    NativePixelEngine.findColorInRegion(
                        plane.buffer,
                        image.width,
                        image.height,
                        plane.rowStride,
                        args.getInteger(0),
                        args.getInteger(1),
                        args.getInteger(2),
                        args.getInteger(3),
                        args.getInteger(4),
                        args.getInteger(5)
                    )
                } finally {
                    image.close()
                }
            }, "findColor")

            context.set("MacroHost", host)
            context.executeVoidScript(script, "macro.js")
            "OK"
        } catch (t: Throwable) {
            "ERROR: ${t.javaClass.simpleName}: ${t.message}"
        } finally {
            runCatching { context?.close() }
            runCatching { runtime?.close() }
            running = false
        }
    }
}
