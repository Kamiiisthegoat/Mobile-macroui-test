package com.kamii.macroexecutor

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.result.ActivityResult
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.ActivityCallback
import com.getcapacitor.annotation.CapacitorPlugin
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

@CapacitorPlugin(name = "MacroBridge")
class MacroBridgePlugin : Plugin() {

    private val ioScope = CoroutineScope(Dispatchers.Default)

    // ── Permission status ────────────────────────────────────

    @PluginMethod
    fun isReady(call: PluginCall) {
        val result = JSObject().apply {
            put("accessibility", MacroAccessibilityService.isConnected())
            put("overlay", FloatingOverlayService.canDrawOverlays(context))
            put("screenCapture", ScreenCaptureHolder.isReady())
            put(
                "ready",
                MacroAccessibilityService.isConnected() &&
                        FloatingOverlayService.canDrawOverlays(context) &&
                        ScreenCaptureHolder.isReady()
            )
        }
        call.resolve(result)
    }

    // ── One-shot permission wizard ──────────────────────────

    @PluginMethod
    fun requestAllPermissions(call: PluginCall) {
        val result = JSObject().apply {
            put("accessibility", MacroAccessibilityService.isConnected())
            put("overlay", FloatingOverlayService.canDrawOverlays(context))
        }

        if (!MacroAccessibilityService.isConnected()) {
            openAccessibilitySettingsInternal()
        }
        if (!FloatingOverlayService.canDrawOverlays(context)) {
            openOverlaySettingsInternal()
        }

        call.resolve(result)
    }

    @PluginMethod
    fun openAccessibilitySettings(call: PluginCall) {
        openAccessibilitySettingsInternal()
        call.resolve()
    }

    private fun openAccessibilitySettingsInternal() {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
            // Some OEM ROMs lack the standard Accessibility settings entry point; fail silently.
        }
    }

    @PluginMethod
    fun openOverlaySettings(call: PluginCall) {
        openOverlaySettingsInternal()
        call.resolve()
    }

    private fun openOverlaySettingsInternal() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
        try {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:${context.packageName}")
            ).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        } catch (_: Exception) {
            // Fallback: application details page.
            try {
                val fallback = Intent(
                    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.parse("package:${context.packageName}")
                ).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
                context.startActivity(fallback)
            } catch (_: Exception) {}
        }
    }

    // ── Screen capture ──────────────────────────────────────

    @PluginMethod
    fun requestScreenCapture(call: PluginCall) {
        val activity = activity ?: run {
            call.reject("No foreground Activity available")
            return
        }

        if (ScreenCaptureHolder.isReady()) {
            call.resolve(JSObject().put("started", true).put("alreadyRunning", true))
            return
        }

        val mpm = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE)
                as MediaProjectionManager
        val intent = mpm.createScreenCaptureIntent()
        startActivityForResult(call, intent, "screenCaptureResult")
    }

    @ActivityCallback
    fun screenCaptureResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return

        if (result.resultCode != Activity.RESULT_OK || result.data == null) {
            call.reject("Screen capture permission denied")
            return
        }

        try {
            ScreenCaptureService.startWithPermission(
                context,
                result.resultCode,
                result.data!!
            )
            call.resolve(JSObject().put("started", true))
        } catch (e: Exception) {
            call.reject("Failed to start screen capture: ${e.message}")
        }
    }

    // ── Overlay control ─────────────────────────────────────

    @PluginMethod
    fun startOverlay(call: PluginCall) {
        if (!FloatingOverlayService.canDrawOverlays(context)) {
            call.reject("Overlay permission not granted")
            return
        }
        FloatingOverlayService.start(context)
        call.resolve(JSObject().put("running", FloatingOverlayService.isRunning))
    }

    @PluginMethod
    fun stopOverlay(call: PluginCall) {
        FloatingOverlayService.stop(context)
        call.resolve(JSObject().put("running", false))
    }

    // ── Macro execution ─────────────────────────────────────

    @PluginMethod
    fun executeQuickJs(call: PluginCall) {
        val script = call.getString("script") ?: run {
            call.reject("Missing 'script' parameter")
            return
        }
        if (!MacroAccessibilityService.isConnected()) {
            call.reject("Accessibility service not connected")
            return
        }
        if (!ScreenCaptureHolder.isReady()) {
            call.reject("Screen capture not ready")
            return
        }

        ioScope.launch {
            val outcome = QuickJsMacroRunner.execute(script)
            activity?.runOnUiThread {
                call.resolve(JSObject().put("result", outcome))
            }
        }
    }

    @PluginMethod
    fun stopMacro(call: PluginCall) {
        QuickJsMacroRunner.stop()
        call.resolve()
    }

    // ── Debug helpers ───────────────────────────────────────

    @PluginMethod
    fun testTap(call: PluginCall) {
        val x = call.getFloat("x") ?: 540f
        val y = call.getFloat("y") ?: 960f
        val ok = MacroAccessibilityService.instance?.performTap(x, y, 50L) ?: false
        call.resolve(JSObject().put("dispatched", ok))
    }

    @PluginMethod
    fun checkPixelNow(call: PluginCall) {
        val x = call.getInt("x") ?: run {
            call.reject("Missing 'x'")
            return
        }
        val y = call.getInt("y") ?: run {
            call.reject("Missing 'y'")
            return
        }
        val reader = ScreenCaptureHolder.imageReader ?: run {
            call.reject("Screen capture not ready")
            return
        }
        val image = reader.acquireLatestImage() ?: run {
            call.reject("No frame available")
            return
        }
        try {
            val plane = image.planes[0]
            val color = NativePixelEngine.getPixelColor(
                plane.buffer, image.width, image.height, plane.rowStride, x, y
            )
            call.resolve(JSObject().put("color", color))
        } catch (e: Exception) {
            call.reject("Pixel read failed: ${e.message}")
        } finally {
            image.close()
        }
    }
}
