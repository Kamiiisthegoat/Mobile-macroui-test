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

    companion object {
        @Volatile
        var instance: FloatingOverlayService? = null
            private set
    }

    private lateinit var windowManager: WindowManager
    private lateinit var overlayView: View
    private lateinit var layoutParams: WindowManager.LayoutParams
    private var isRunning = false
    
    private var currentMode = 0 // 0 = TGL, 1 = 1X, 2 = ARM
    private var isArmed = false

    private lateinit var statusDot: View
    private lateinit var modeBtn: TextView
    private lateinit var actionBtn: TextView
    private lateinit var statusText: TextView

    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
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
                shape = GradientDrawable.RECTANGLE
                cornerRadius = dpToPx(50).toFloat()
                setColor(Color.parseColor("#E6121215"))
                setStroke(dpToPx(1), Color.parseColor("#333333"))
            }
            background = bg
            elevation = dpToPx(8).toFloat()
        }

        val dotBg = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#FF4444"))
            setStroke(dpToPx(2), Color.parseColor("#33FFFFFF"))
        }
        statusDot = View(this).apply {
            layoutParams = LinearLayout.LayoutParams(dpToPx(14), dpToPx(14)).apply { marginEnd = dpToPx(12) }
            background = dotBg
        }

        statusText = TextView(this).apply {
            text = ""
            setTextColor(Color.parseColor("#AAAAAA"))
            textSize = 11f
            typeface = Typeface.create("sans-serif", Typeface.NORMAL)
            setPadding(dpToPx(4), 0, dpToPx(8), 0)
        }

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

        container.addView(statusDot)
        container.addView(statusText)
        container.addView(modeBtn)
        container.addView(View(this).apply { layoutParams = LinearLayout.LayoutParams(dpToPx(8), 1) })
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
        updateUI()
    }

    fun setOverlayText(text: String) {
        mainHandler.post { statusText.text = text }
    }

    fun setOverlayVisibility(visible: Boolean) {
        mainHandler.post { overlayView.visibility = if (visible) View.VISIBLE else View.GONE }
    }

    fun moveOverlay(x: Int, y: Int) {
        mainHandler.post {
            layoutParams.x = x
            layoutParams.y = y
            windowManager.updateViewLayout(overlayView, layoutParams)
        }
    }

    fun setOverlayDotColor(colorHex: String) {
        mainHandler.post {
            try {
                val color = Color.parseColor(colorHex)
                (statusDot.background as? GradientDrawable)?.setColor(color)
            } catch (_: Exception) {}
        }
    }

    private fun handleActionClick() {
        when (currentMode) {
            0 -> { if (!isRunning) startScript() else { isRunning = false; QuickJsMacroRunner.stop() } }
            1 -> { if (!isRunning) startScript() }
            2 -> {
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
        setOverlayText("Starting...")
        val scriptToRun = QuickJsMacroRunner.lastExecutedScript ?: "log('No script loaded.');"
        
        QuickJsMacroRunner.execute(this, scriptToRun, object : QuickJsMacroRunner.Listener {
            override fun onStarted() {}
            override fun onLog(message: String) {}
            
            override fun onCompleted() { resetUi() }
            override fun onStopped() { resetUi() }
            
            // 🔥 IF THERE IS AN ERROR, SHOW IT ON THE FLOATY!
            override fun onError(message: String, stack: String?) { 
                mainHandler.post {
                    isRunning = false
                    isArmed = false
                    setOverlayText("Error: $message")
                    (statusDot.background as? GradientDrawable)?.setColor(Color.RED)
                    updateUI()
                    // Wait 3 seconds so you can read the error, then clear it
                    mainHandler.postDelayed({ statusText.text = "" }, 3000)
                }
            }
        })
    }

    private fun resetUi() {
        mainHandler.post {
            isRunning = false
            isArmed = false
            statusText.text = ""
            updateUI()
        }
    }

    private fun updateUI() {
        when (currentMode) {
            0 -> {
                modeBtn.text = "TGL"
                actionBtn.text = if (isRunning) "STOP" else "PLAY"
                (actionBtn.background as? GradientDrawable)?.setColor(Color.parseColor(if (isRunning) "#EF4444" else "#4CAF50"))
                (statusDot.background as? GradientDrawable)?.setColor(Color.parseColor(if (isRunning) "#4CAF50" else "#FF4444"))
            }
            1 -> {
                modeBtn.text = "1X"
                actionBtn.text = "RUN"
                (actionBtn.background as? GradientDrawable)?.setColor(Color.parseColor("#3B82F6"))
                (statusDot.background as? GradientDrawable)?.setColor(Color.parseColor(if (isRunning) "#4CAF50" else "#FF4444"))
            }
            2 -> {
                modeBtn.text = "ARM"
                actionBtn.text = if (isArmed) "FIRE" else "ARM"
                (actionBtn.background as? GradientDrawable)?.setColor(Color.parseColor(if (isArmed) "#EF4444" else "#F59E0B"))
                (statusDot.background as? GradientDrawable)?.setColor(Color.parseColor(if (isArmed) "#F59E0B" else "#FF4444"))
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
        if (::overlayView.isInitialized) windowManager.removeView(overlayView)
    }
}
