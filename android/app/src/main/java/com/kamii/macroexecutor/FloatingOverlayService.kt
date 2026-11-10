package com.kamii.macroexecutor

import android.app.*
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
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

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(0xCC222222.toInt())
            setPadding(24, 12, 24, 12)
            gravity = Gravity.CENTER_VERTICAL
            // Rounded corners
            val shape = GradientDrawable()
            shape.shape = GradientDrawable.RECTANGLE
            shape.cornerRadius = 50f
            shape.setColor(0xCC222222.toInt())
            background = shape
        }

        // Status Dot (Green = Running, Red = Stopped, Yellow = Armed)
        val dotShape = GradientDrawable().apply { shape = GradientDrawable.OVAL; setColor(Color.RED) }
        statusDot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(24, 24).apply { marginEnd = 24 }
            background = dotShape
        }

        // Mode Switcher (TGL / 1X / ARM)
        modeBtn = TextView(this).apply {
            text = "TGL"
            setTextColor(Color.WHITE)
            textSize = 12f
            setPadding(32, 16, 32, 16)
            val bg = GradientDrawable().apply { cornerRadius = 30f; setColor(0xFF444444.toInt()) }
            background = bg
            setOnClickListener {
                currentMode = (currentMode + 1) % 3
                updateUI()
            }
        }

        // Action Button
        actionBtn = TextView(this).apply {
            text = "PLAY"
            setTextColor(Color.WHITE)
            textSize = 16f
            setTypeface(null, android.graphics.Typeface.BOLD)
            setPadding(48, 16, 48, 16)
            val bg = GradientDrawable().apply { cornerRadius = 30f; setColor(0xFF4CAF50.toInt()) }
            background = bg
            setOnClickListener { handleActionClick() }
        }

        val spacer = View(this).apply { layoutParams = LinearLayout.LayoutParams(24, 1) }

        container.addView(statusDot)
        container.addView(modeBtn)
        container.addView(spacer)
        container.addView(actionBtn)

        // Draggable logic
        container.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(v: View?, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x; initialY = params.y
                        initialTouchX = event.rawX; initialTouchY = event.rawY
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        params.x = initialX + (event.rawX - initialTouchX).toInt()
                        params.y = initialY + (event.rawY - initialTouchY).toInt()
                        windowManager.updateViewLayout(overlayView, params)
                        return true
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
            0 -> { // Toggle Mode
                if (!isRunning) startScript() else { isRunning = false; QuickJsMacroRunner.stop() }
            }
            1 -> { // Single Press Mode
                if (!isRunning) startScript()
            }
            2 -> { // Arm / Fire Mode
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
            log("No script loaded. Defaulting to a 1-second wait and tap.");
            await sleep(1000);
            host.tap(540, 960);
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
                (actionBtn.background as? GradientDrawable)?.setColor(if (isRunning) Color.RED else Color.parseColor("#4CAF50"))
                (statusDot.background as? GradientDrawable)?.setColor(if (isRunning) Color.GREEN else Color.RED)
            }
            1 -> { // Single Press
                modeBtn.text = "1X"
                actionBtn.text = "RUN"
                (actionBtn.background as? GradientDrawable)?.setColor(Color.parseColor("#2196F3"))
                (statusDot.background as? GradientDrawable)?.setColor(if (isRunning) Color.GREEN else Color.RED)
            }
            2 -> { // Arm / Fire
                modeBtn.text = "ARM"
                actionBtn.text = if (isArmed) "FIRE" else "ARM"
                (actionBtn.background as? GradientDrawable)?.setColor(if (isArmed) Color.RED else Color.parseColor("#FF9800"))
                (statusDot.background as? GradientDrawable)?.setColor(if (isArmed) Color.YELLOW else Color.RED)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::overlayView.isInitialized) windowManager.removeView(overlayView)
    }
}
