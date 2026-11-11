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
import android.util.TypedValue
import android.view.*
import android.widget.*
import androidx.core.app.NotificationCompat

class FloatingOverlayService : Service() {

    companion object {
        @Volatile var instance: FloatingOverlayService? = null
            private set
    }

    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: View
    private lateinit var layoutParams: WindowManager.LayoutParams
    private var isRunning = false
    
    private lateinit var statusDot: View
    private lateinit var actionBtn: TextView
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        createOverlay()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val channelId = "overlay_channel"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(channelId, "Overlay", NotificationManager.IMPORTANCE_LOW)
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("MacroExecutor")
            .setContentText("Floating controls active")
            .setSmallIcon(android.R.drawable.ic_menu_manage)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(2, notification, android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(2, notification)
        }
        return START_STICKY
    }

    private fun dpToPx(dp: Int): Int = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp.toFloat(), resources.displayMetrics).toInt()

    private fun createOverlay() {
        layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY else WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )
        layoutParams.gravity = Gravity.TOP or Gravity.START
        layoutParams.x = 100; layoutParams.y = 200

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
            setPadding(dpToPx(16), dpToPx(10), dpToPx(16), dpToPx(10))
            val bg = GradientDrawable().apply {
                cornerRadius = dpToPx(50).toFloat()
                setColor(Color.parseColor("#E6121215"))
                setStroke(dpToPx(1), Color.parseColor("#333333"))
            }
            background = bg
        }

        val dotBg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.RED)
        }
        statusDot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(14), dpToPx(14)).apply { marginEnd = dpToPx(12) }
            background = dotBg
        }

        actionBtn = TextView(this).apply {
            text = "PLAY"
            setTextColor(Color.WHITE)
            textSize = 14f
            setPadding(dpToPx(20), dpToPx(6), dpToPx(20), dpToPx(6))
            val bg = GradientDrawable().apply {
                cornerRadius = dpToPx(20).toFloat()
                setColor(Color.parseColor("#4CAF50"))
            }
            background = bg
            setOnClickListener {
                if (!isRunning) {
                    isRunning = true
                    text = "STOP"
                    (background as? GradientDrawable)?.setColor(Color.parseColor("#EF4444"))
                    (statusDot.background as? GradientDrawable)?.setColor(Color.parseColor("#4CAF50"))
                    
                    val script = QuickJsMacroRunner.lastExecutedScript ?: "log('No script loaded.');"
                    
                    // 🔥 EXACT FIX: 3rd argument is "{}"
                    QuickJsMacroRunner.execute(this@FloatingOverlayService, script, "{}", object : QuickJsMacroRunner.Listener {
                        override fun onStarted() {}
                        override fun onLog(message: String) {}
                        override fun onCompleted() { reset() }
                        override fun onStopped() { reset() }
                        override fun onError(message: String, stack: String?) { reset() }
                    })
                } else {
                    isRunning = false
                    QuickJsMacroRunner.stop()
                    reset()
                }
            }
        }

        container.addView(statusDot)
        container.addView(actionBtn)

        container.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f
            private var isDragging = false

            override fun onTouch(v: View?, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = layoutParams.x; initialY = layoutParams.y
                        initialTouchX = event.rawX; initialTouchY = event.rawY
                        isDragging = false
                        return true
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = (event.rawX - initialTouchX).toInt()
                        val dy = (event.rawY - initialTouchY).toInt()
                        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) isDragging = true
                        if (isDragging) {
                            layoutParams.x = initialX + dx
                            layoutParams.y = initialY + dy
                            windowManager.updateViewLayout(overlayView, layoutParams)
                        }
                        return true
                    }
                    MotionEvent.ACTION_UP -> return isDragging
                }
                return false
            }
        })

        overlayView = container
        windowManager.addView(overlayView, layoutParams)
    }

    private fun reset() {
        mainHandler.post {
            isRunning = false
            actionBtn.text = "PLAY"
            (actionBtn.background as? GradientDrawable)?.setColor(Color.parseColor("#4CAF50"))
            (statusDot.background as? GradientDrawable)?.setColor(Color.RED)
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        if (::overlayView.isInitialized) windowManager.removeView(overlayView)
    }
}
