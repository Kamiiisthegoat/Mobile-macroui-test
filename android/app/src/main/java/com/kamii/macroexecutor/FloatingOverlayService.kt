package com.kamii.macroexecutor

import android.app.*
import android.content.Intent
import android.graphics.Color
import android.graphics.PixelFormat
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
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else WindowManager.LayoutParams.TYPE_PHONE,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
            PixelFormat.TRANSLUCENT
        )
        params.gravity = Gravity.TOP or Gravity.START
        params.x = 100; params.y = 200

        val container = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            setBackgroundColor(0xCC222222.toInt())
            setPadding(16, 8, 16, 8)
        }

        val statusDot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(24, 24).apply { marginEnd = 16 }
            setBackgroundColor(Color.RED) // Red = Stopped
        }

        // Reset the UI safely on the Main thread
        val resetUiToStopped = {
            Handler(Looper.getMainLooper()).post {
                isRunning = false
                statusDot.setBackgroundColor(Color.RED)
                // Find the button inside container and change text
                val btn = (container.getChildAt(1) as? Button)
                btn?.text = "PLAY"
            }
        }

        val playStopBtn = Button(this).apply {
            text = "PLAY"
            setOnClickListener {
                isRunning = !isRunning
                text = if (isRunning) "STOP" else "PLAY"
                statusDot.setBackgroundColor(if (isRunning) Color.GREEN else Color.RED)

                if (isRunning) {
                    // Fetch the last script from the React UI, or run a fallback test
                    val scriptToRun = QuickJsMacroRunner.lastExecutedScript ?: """
                        log("Overlay started: No script loaded, doing test tap.");
                        await sleep(500);
                        host.tap(540, 960);
                    """.trimIndent()

                    QuickJsMacroRunner.execute(this@FloatingOverlayService, scriptToRun, object : QuickJsMacroRunner.Listener {
                        override fun onStarted() {
                            android.util.Log.d("Overlay", "Macro started from Overlay")
                        }
                        override fun onLog(message: String) {
                            android.util.Log.d("Overlay", message)
                        }
                        override fun onCompleted() {
                            resetUiToStopped()
                        }
                        override fun onStopped() {
                            resetUiToStopped()
                        }
                        override fun onError(message: String, stack: String?) {
                            android.util.Log.e("Overlay", "Error: $message")
                            resetUiToStopped()
                        }
                    })
                } else {
                    QuickJsMacroRunner.stop()
                }
            }
        }

        container.addView(statusDot)
        container.addView(playStopBtn)

        // Make the pill draggable
        container.setOnTouchListener(object : View.OnTouchListener {
            private var initialX = 0
            private var initialY = 0
            private var initialTouchX = 0f
            private var initialTouchY = 0f

            override fun onTouch(v: View?, event: MotionEvent): Boolean {
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        initialX = params.x
                        initialY = params.y
                        initialTouchX = event.rawX
                        initialTouchY = event.rawY
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
    }

    override fun onDestroy() {
        super.onDestroy()
        if (::overlayView.isInitialized) {
            windowManager.removeView(overlayView)
        }
    }
}
