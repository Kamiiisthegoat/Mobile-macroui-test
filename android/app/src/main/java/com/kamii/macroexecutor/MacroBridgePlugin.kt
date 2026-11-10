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

@CapacitorPlugin(name = "MacroBridge")
class MacroBridgePlugin : Plugin() {

    private fun canDrawOverlays(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)

    private fun accessibilityReady(): Boolean =
        MacroAccessibilityService.instance != null

    @PluginMethod
    fun isReady(call: PluginCall) {
        val acc = accessibilityReady()
        val ovl = canDrawOverlays()
        val cap = ScreenCaptureHolder.isReady
        call.resolve(
            JSObject().apply {
                put("accessibility", acc)
                put("overlay", ovl)
                put("screenCapture", cap)
                put("ready", acc && ovl && cap)
            }
        )
    }

    @PluginMethod
    fun checkPermissionsStatus(call: PluginCall) = isReady(call)

    @PluginMethod
    fun requestAllPermissions(call: PluginCall) {
        if (!accessibilityReady()) openAccessibilitySettingsInternal()
        if (!canDrawOverlays()) openOverlaySettingsInternal()
        isReady(call)
    }

    @PluginMethod
    fun openAccessibilitySettings(call: PluginCall) {
        openAccessibilitySettingsInternal()
        call.resolve()
    }

    private fun openAccessibilitySettingsInternal() {
        try {
            context.startActivity(
                Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (_: Exception) { /* OEM may hide this screen */ }
    }

    @PluginMethod
    fun openOverlaySettings(call: PluginCall) {
        openOverlaySettingsInternal()
        call.resolve()
    }

    private fun openOverlaySettingsInternal() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return
        try {
            context.startActivity(
                Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${context.packageName}")
                ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        } catch (_: Exception) {
            try {
                context.startActivity(
                    Intent(
                        Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                        Uri.parse("package:${context.packageName}")
                    ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                )
            } catch (_: Exception) { /* give up silently */ }
        }
    }

    @PluginMethod
    fun requestScreenCapture(call: PluginCall) {
        if (ScreenCaptureHolder.isReady) {
            call.resolve(JSObject().put("started", true).put("alreadyRunning", true))
            return
        }
        val activity = activity ?: run {
            call.reject("No foreground Activity available")
            return
        }
        val mpm = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE)
                as MediaProjectionManager
        startActivityForResult(call, mpm.createScreenCaptureIntent(), "screenCaptureResult")
    }

    @ActivityCallback
    fun screenCaptureResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        if (result.resultCode != Activity.RESULT_OK || result.data == null) {
            call.reject("Screen capture permission denied")
            return
        }
        try {
            ScreenCaptureService.startWithPermission(context, result.resultCode, result.data!!)
            call.resolve(JSObject().put("started", true))
        } catch (e: Exception) {
            call.reject("Failed to start screen capture: ${e.message}")
        }
    }

    @PluginMethod
    fun startOverlay(call: PluginCall) {
        if (!canDrawOverlays()) {
            call.reject("Overlay permission not granted")
            return
        }
        val intent = Intent(context, FloatingOverlayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent)
        } else {
            context.startService(intent)
        }
        call.resolve(JSObject().put("running", true))
    }

    @PluginMethod
    fun stopOverlay(call: PluginCall) {
        context.stopService(Intent(context, FloatingOverlayService::class.java))
        call.resolve(JSObject().put("running", false))
    }

    @PluginMethod
    fun executeQuickJs(call: PluginCall) {
        val script = call.getString("script") ?: run {
            call.reject("Missing 'script' parameter")
            return
        }
        if (!accessibilityReady()) {
            call.reject("Accessibility service not connected")
            return
        }
        if (!ScreenCaptureHolder.isReady) {
            call.reject("Screen capture not ready")
            return
        }
        QuickJsMacroRunner.execute(context, script)
        call.resolve(JSObject().put("started", true))
    }

    @PluginMethod
    fun executeScript(call: PluginCall) = executeQuickJs(call)

    @PluginMethod
    fun stopMacro(call: PluginCall) {
        QuickJsMacroRunner.stop()
        call.resolve()
    }

    @PluginMethod
    fun stopScript(call: PluginCall) = stopMacro(call)

    @PluginMethod
    fun testTap(call: PluginCall) {
        val x = call.getFloat("x") ?: 540f
        val y = call.getFloat("y") ?: 960f
        val svc = MacroAccessibilityService.instance ?: run {
            call.reject("Accessibility service not connected")
            return
        }
        svc.performTap(x, y, 50L)
        call.resolve(JSObject().put("dispatched", true))
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
        if (!ScreenCaptureHolder.isReady) {
            call.reject("Screen capture not ready")
            return
        }
        val color = ScreenCaptureHolder.getPixel(x, y)
        call.resolve(JSObject().put("color", color))
    }
}
