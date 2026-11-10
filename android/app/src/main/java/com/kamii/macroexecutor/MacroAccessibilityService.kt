package com.kamii.macroexecutor

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.view.accessibility.AccessibilityEvent
import androidx.annotation.RequiresApi

class MacroAccessibilityService : AccessibilityService() {

    companion object {
        @Volatile
        var instance: MacroAccessibilityService? = null
            private set

        fun isConnected(): Boolean = instance != null
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
    }

    override fun onDestroy() {
        if (instance === this) instance = null
        super.onDestroy()
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) = Unit

    override fun onInterrupt() = Unit

    @RequiresApi(Build.VERSION_CODES.N)
    fun performTap(x: Float, y: Float, durationMs: Long = 50L): Boolean {
        val path = Path().apply { moveTo(x, y) }
        val stroke = GestureDescription.StrokeDescription(path, 0L, durationMs)
        return dispatchGesture(
            GestureDescription.Builder().addStroke(stroke).build(),
            null,
            null
        )
    }

    @RequiresApi(Build.VERSION_CODES.N)
    fun performSwipe(
        x1: Float, y1: Float,
        x2: Float, y2: Float,
        durationMs: Long
    ): Boolean {
        val path = Path().apply {
            moveTo(x1, y1)
            lineTo(x2, y2)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0L, durationMs)
        return dispatchGesture(
            GestureDescription.Builder().addStroke(stroke).build(),
            null,
            null
        )
    }

    @RequiresApi(Build.VERSION_CODES.N)
    fun performMultiStepGesture(steps: List<GestureStep>): Boolean {
        if (steps.isEmpty()) return false
        val builder = GestureDescription.Builder()
        for (step in steps) {
            val path = Path().apply {
                moveTo(step.x1, step.y1)
                lineTo(step.x2, step.y2)
            }
            builder.addStroke(
                GestureDescription.StrokeDescription(path, step.startTime, step.durationMs)
            )
        }
        return dispatchGesture(builder.build(), null, null)
    }

    data class GestureStep(
        val x1: Float, val y1: Float,
        val x2: Float, val y2: Float,
        val startTime: Long,
        val durationMs: Long
    )
}
