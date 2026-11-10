package com.kamii.macroexecutor

import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.TextView
import kotlin.math.abs

class FloatingOverlayService : Service() {

    companion object {
        @Volatile var isRunning: Boolean = false
            private set

        fun canDrawOverlays(context: Context): Boolean =
            Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)

        fun start(context: Context) {
            if (!canDrawOverlays(context)) return
            val intent = Intent(context, FloatingOverlayService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, FloatingOverlayService::class.java))
        }
    }

    private lateinit var windowManager: WindowManager
    private var overlayView: View? = null
    private lateinit var params: WindowManager.LayoutParams
    private lateinit var statusDot: TextView
    private lateinit var statusLabel: TextView

    override fun onCreate() {
        super.onCreate()
        isRunning = true
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        createOverlay()
    }

    private fun createOverlay() {
        val dp = resources.displayMetrics.density
        fun Int.dp() = (this * dp).toInt()

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(12.dp(), 8.dp(), 12.dp(), 8.dp())
            background = GradientDrawable().apply {
                cornerRadius = 24f * dp
                setColor(Color.parseColor("#CC1E1E2E"))
                setStroke(2.dp(), Color.parseColor("#555566"))
            }
        }

        statusDot = TextView(this).apply {
            text = "\u25CF" // ●
            textSize = 14f
            setTextColor(Color.parseColor("#888899"))
            setPadding(0, 0, 6.dp(), 0)
        }

        statusLabel = TextView(this).apply {
            text = "START"
            textSize = 12f
            setTextColor(Color.WHITE)
            setPadding(0, 0, 10.dp(), 0)
        }

        val stopButton = TextView(this).apply {
            text = "STOP"
            textSize = 12f
            setTextColor(Color.parseColor("#FF6B6B"))
            setPadding(6.dp(), 0, 0, 0)
        }

        container.addView(statusDot)
        container.addView(statusLabel)
        container.addView(stopButton)

        params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = 24.dp()
            y = 240.dp()
        }

        // Drag to move; tap left half = START; tap right half = STOP.
        var initialX = 0
        var initialY = 0
        var initialTouchX = 0f
        var initialTouchY = 0f
        var moved = false

        container.setOnTouchListener { _, event ->
            when (event.action) {
                MotionEvent.ACTION_DOWN -> {
                    initialX = params.x
                    initialY = params.y
                    initialTouchX = event.rawX
                    initialTouchY = event.rawY
                    moved = false
                    true
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (event.rawX - initialTouchX).toInt()
                    val dy = (event.rawY - initialTouchY).toInt()
                    if (abs(dx) > 10 || abs(dy) > 10) moved = true
                    params.x = (initialX + dx).coerceAtLeast(0)
                    params.y = (initialY + dy).coerceAtLeast(0)
                    windowManager.updateViewLayout(container, params)
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!moved) {
                        if (event.rawX > container.width * 0.55f) {
                            // STOP was tapped
                            QuickJsMacroRunner.stop()
                            updateStatus("STOPPED", "#FF6B6B")
                        } else {
                            // START was tapped
                            updateStatus("READY", "#4CAF50")
                        }
                    }
                    true
                }
                else -> false
            }
        }

        overlayView = container
        windowManager.addView(container, params)
    }

    private fun updateStatus(label: String, colorHex: String) {
        statusLabel.text = label
        statusDot.setTextColor(Color.parseColor(colorHex))
    }

    override fun onDestroy() {
        overlayView?.let {
            runCatching { windowManager.removeView(it) }
        }
        overlayView = null
        isRunning = false
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
