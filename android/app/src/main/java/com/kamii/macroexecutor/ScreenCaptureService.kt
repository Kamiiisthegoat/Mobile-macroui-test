package com.kamii.macroexecutor

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class ScreenCaptureService : Service() {

    companion object {
        const val CHANNEL_ID = "macro_capture"
        const val NOTIFICATION_ID = 1001
        const val EXTRA_RESULT_CODE = "resultCode"
        const val EXTRA_DATA = "data"

        @Volatile
        var instance: ScreenCaptureService? = null
            private set

        fun startWithPermission(context: Context, resultCode: Int, data: Intent) {
            val intent = Intent(context, ScreenCaptureService::class.java).apply {
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_DATA, data)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        instance = this
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // startForeground must be called within 5 seconds or the system kills the process.
        startForeground(NOTIFICATION_ID, buildNotification())

        val resultCode = intent?.getIntExtra(EXTRA_RESULT_CODE, Activity.RESULT_CANCELED)
            ?: Activity.RESULT_CANCELED
        @Suppress("DEPRECATION")
        val data = intent?.getParcelableExtra<Intent>(EXTRA_DATA)

        if (resultCode != Activity.RESULT_OK || data == null) {
            stopSelf()
            return START_NOT_STICKY
        }

        if (!ScreenCaptureHolder.isReady()) {
            startProjection(resultCode, data)
        }
        return START_STICKY
    }

    private fun startProjection(resultCode: Int, data: Intent) {
        val mpm = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        val projection: MediaProjection = mpm.getMediaProjection(resultCode, data)
            ?: run { stopSelf(); return }

        ScreenCaptureHolder.mediaProjection = projection

        val metrics = resources.displayMetrics
        val w = metrics.widthPixels
        val h = metrics.heightPixels
        val dpi = metrics.densityDpi

        // PixelFormat.RGBA_8888 corresponds to R,G,B,A byte order read by C++.
        val reader = ImageReader.newInstance(w, h, PixelFormat.RGBA_8888, 4)

        val vd: VirtualDisplay? = projection.createVirtualDisplay(
            "MacroCapture",
            w, h, dpi,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            reader.surface,
            null,
            null
        )

        if (vd == null) {
            reader.close()
            projection.stop()
            stopSelf()
            return
        }

        ScreenCaptureHolder.imageReader = reader
        ScreenCaptureHolder.virtualDisplay = vd
        ScreenCaptureHolder.width = w
        ScreenCaptureHolder.height = h
        // RGBA_8888: bytes-per-row is usually width * 4, but some devices add padding.
        // Always read the actual plane[0].rowStride on each frame acquisition.
        ScreenCaptureHolder.rowStride = w * 4
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "MacroExecutor Screen Capture",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps the screen frame buffer accessible to the macro engine"
                setShowBadge(false)
            }
            getSystemService(NotificationManager::class.java)
                .createNotificationChannel(channel)
        }
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("MacroExecutor")
            .setContentText("Screen capture is running")
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        ScreenCaptureHolder.reset()
        instance = null
        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
