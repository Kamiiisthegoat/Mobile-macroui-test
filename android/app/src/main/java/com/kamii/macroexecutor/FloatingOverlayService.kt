package com.kamii.macroexecutor

import android.app.*
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.TypedValue
import android.view.*
import android.widget.*
import androidx.core.app.NotificationCompat

class FloatingOverlayService : Service() {

    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: View
    private var isRunning = false
    
    // 0 = Toggle, 1 = Single Press, 2 = Arm/Fire
    private var currentMode = 0
    private var isArmed = false

    private lateinit var statusDot: View
    private lateinit var modeBtn: TextView
    private lateinit var actionBtn: TextView

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createOverlay()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(2, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(2, notification)
        }
        return START_STICKY
    }

    private fun createNotification(): Notification {
        val channelId = "overlay_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Overlay", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        return NotificationCompat.Builder(this, channelId)
            .setContentTitle("MacroExecutor")
            .setContentText("Floating controls active")
            .setSmallIcon(android.R.drawable.ic_menu_manage)
            .build()
    }

    private fun dpToPx(dp: Int): Int {
        return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp.toFloat(), resources.displayMetrics).toInt()
    }

    private fun createOverlay() {
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )
        params.gravity = Gravity.TOP or Gravity.START
        params.x = 100; params.y = 200

        // Main Container (Dark, Semi-transparent, Pill-shaped)
        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dpToPx(16), dpToPx(10), dpToPx(16), dpToPx(10))
            val bg = GradientDrawable().apply {
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dpToPx(50).toFloat()
                setColor(Color.parseColor("#E6121215")) // Sleek dark gray with 90% opacity
                setStroke(dpToPx(1), Color.parseColor("#333333")) // Subtle border
            }
            background = bg
            elevation = dpToPx(8).toFloat()
        }

        // Status Dot
        val dotBg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#FF4444")) // Red
            setStroke(dpToPx(2), Color.parseColor("#33FFFFFF")) // White ring
        }
        statusDot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(14), dpToPx(14)).apply { marginEnd = dpToPx(12) }
            background = dotBg
        }

        // Mode Switcher (TGL / 1X / ARM)
        modeBtn = TextView(this).apply {
            text = "TGL"
            setTextColor(Color.parseColor("#AAAAAA"))
            textSize = 11f
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
            setPadding(dpToPx(12), dpToPx(6), dpToPx(12), dpToPx(6))
            val bg = GradientDrawable().apply {
                cornerRadius = dpToPx(20).toFloat()
                setColor(Color.parseColor("#2A2A30"))
            }
            background = bg
            setOnClickListener {
                currentMode = (currentMode + 1) % 3
                updateUI()
            }
        }

        // Action Button (Play/Stop/Arm/Fire)
        actionBtn = TextView(this).apply {
            text = "PLAY"
            setTextColor(Color.WHITE)
            textSize = 14f
            typeface = Typeface.create("sans-serif-medium", Typeface.NORMAL)
            setPadding(dpToPx(20), dpToPx(6), dpToPx(20), dpToPx(6))
            val bg = GradientDrawable().apply {
                cornerRadius = dpToPx(20).toFloat()
                setColor(Color.parseColor("#4CAF50"))
            }
            background = bg
            setOnClickListener { handleActionClick() }
        }

        val spacer = View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(8), 1) }

        container.addView(statusDot)
        container.addView(modeBtn)
        container.addView(spacer)
        container.addView(actionBtn)

        // Smooth Drag Logic
        container.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            private var isDragging = false

            override fun onTouch(v: View?, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x; initialY = params.y
                        initialTouchX = event.rawX; initialTouchY = event.rawY
                        isDragging = false
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) isDragging = true
                        if (isDragging) {
                            params.x = initialX + dx
                            params.y = initialY + dy
                            windowManager.updateViewLayout(overlayView, params)
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP -> {
                        // If we weren't dragging, let the button clicks handle themselves
                        return isDragging
                    }
                }
                return false
            }
        })

        overlayView = container
        windowManager.addView(overlayView, params)
        updateUI()
    }

    private fun handleActionClick() {
        when (currentMode) {
            0 -> { // TGL Mode
                if (!isRunning) startScript() else { isRunning = false; QuickJsMacroRunner.stop() }
            }
            1 -> { // 1X Mode
                if (!isRunning) startScript()
            }
            2 -> { // ARM Mode
                if (!isArmed) {
                    isArmed = true
                    if (!isRunning) startScript()
                    QuickJsMacroRunner.sendEvent("arm")
                } else {
                    isArmed = false
                    QuickJsMacroRunner.sendEvent("fire")
                }
            }
        }
        updateUI()
    }

    private fun startScript() {
        isRunning = true
        val scriptToRun = QuickJsMacroRunner.lastExecutedScript ?: """
            log("No script loaded.");
        """.trimIndent()

        QuickJsMacroRunner.execute(this, scriptToRun, object : QuickJsMacroRunner.Listener {
            override fun onStarted() {}
            override fun onLog(message: String) {}
            override fun onCompleted() { resetUi() }
            override fun onStopped() { resetUi() }
            override fun onError(message: String, stack: String?) { resetUi() }
        })
    }

    private fun resetUi() {
        Handler(Looper.getMainLooper()).post {
            isRunning = false
            isArmed = false
            updateUI()
        }
    }

    private fun updateUI() {
        when (currentMode) {
            0 -> { // Toggle
                modeBtn.text = "TGL"
                actionBtn.text = if (isRunning) "STOP" else "PLAY"
                (actionBtn.background as? GradientDrawable)?.setColor(Color.parseColor(if (isRunning) "#EF4444" else "#4CAF50"))
                (statusDot.background as? GradientDrawable)?.setColor(Color.parseColor(if (isRunning) "#4CAF50" else "#FF4444"))
            }
            1 -> { // Single Press
                modeBtn.text = "1X"
                actionBtn.text = "RUN"
                (actionBtn.background as? GradientDrawable)?.setColor(Color.parseColor("#3B82F6"))
                (statusDot.background as? GradientDrawable)?.setColor(Color.parseColor(if (isRunning) "#4CAF50" else "#FF4444"))
            }
            2 -> { // Arm / Fire
                modeBtn.text = "ARM"
                actionBtn.text = if (isArmed) "FIRE" else "ARM"
                (actionBtn.background as? GradientDrawable)?.setColor(Color.parseColor(if (isArmed) "#EF4444" else "#F59E0B"))
                (statusDot.background as? GradientDrawable)?.setColor(Color.parseColor(if (isArmed) "#F59E0B" else "#FF4444"))
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::overlayView.isInitialized) windowManager.removeView(overlayView)
    }
}
