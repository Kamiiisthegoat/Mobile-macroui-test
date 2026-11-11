package com.kamii.macroexecutor

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Handler
import android.os.HandlerThread
import android.view.accessibility.AccessibilityEvent

class MacroAccessibilityService : AccessibilityService() {
    companion object {
        @Volatile var instance: MacroAccessibilityService? = null
            private set
    }

    private lateinit var backgroundThread: HandlerThread
    private lateinit var backgroundHandler: Handler

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        backgroundThread = HandlerThread("GestureThread").apply { start() }
        backgroundHandler = Handler(backgroundThread.looper)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {}
    override fun onInterrupt() {}

    override fun onDestroy() {
        if (instance === this) instance = null
        backgroundThread.quitSafely()
        super.onDestroy()
    }

    fun performTap(x: Float, y: Float, durationMs: Long): Boolean {
        val path = Path().apply { moveTo(x, y) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0L, durationMs))
            .build()
        return dispatchGesture(gesture, null, backgroundHandler)
    }

    fun performLongPress(x: Float, y: Float, durationMs: Long): Boolean {
        return performTap(x, y, durationMs)
    }

    fun performSwipe(x1: Float, y1: Float, x2: Float, y2: Float, durationMs: Long): Boolean {
        val path = Path().apply { moveTo(x1, y1); lineTo(x2, y2) }
        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path, 0L, durationMs))
            .build()
        return dispatchGesture(gesture, null, backgroundHandler)
    }

    fun performDualSwipe(
        x1: Float, y1: Float, x2: Float, y2: Float,
        x3: Float, y3: Float, x4: Float, y4: Float,
        durationMs: Long
    ): Boolean {
        val path1 = Path().apply { moveTo(x1, y1); lineTo(x2, y2) }
        val path2 = Path().apply { moveTo(x3, y3); lineTo(x4, y4) }

        val gesture = GestureDescription.Builder()
            .addStroke(GestureDescription.StrokeDescription(path1, 0L, durationMs))
            .addStroke(GestureDescription.StrokeDescription(path2, 0L, durationMs))
            .build()
        return dispatchGesture(gesture, null, backgroundHandler)
    }
}
