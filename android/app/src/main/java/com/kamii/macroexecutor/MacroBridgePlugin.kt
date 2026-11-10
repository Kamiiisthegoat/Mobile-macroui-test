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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import org.json.JSONArray

@CapacitorPlugin(name = "MacroBridge")
class MacroBridgePlugin : Plugin() {

    private val ioScope = CoroutineScope(Dispatchers.IO)

    private fun canDrawOverlays(): Boolean =
        Build.VERSION.SDK_INT < Build.VERSION_CODES.M || Settings.canDrawOverlays(context)

    private fun accessibilityReady(): Boolean = MacroAccessibilityService.instance != null

    @PluginMethod
    fun isReady(call: PluginCall) {
        val acc = accessibilityReady()
        val ovl = canDrawOverlays()
        val cap = ScreenCaptureHolder.isReady
        call.resolve(JSObject().apply {
            put("accessibility", acc)
            put("overlay", ovl)
            put("screenCapture", cap)
            put("ready", acc && ovl && cap)
        })
    }

    @PluginMethod
    fun requestAllPermissions(call: PluginCall) {
        if (!accessibilityReady()) openAccessibilitySettingsInternal()
        if (!canDrawOverlays()) openOverlaySettingsInternal()
        isReady(call)
    }

    private fun openAccessibilitySettingsInternal() {
        try {
            context.startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (_: Exception) { }
    }

    private fun openOverlaySettingsInternal() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                context.startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:${context.packageName}")).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
            } catch (_: Exception) { }
        }
    }

    @PluginMethod
    fun requestScreenCapture(call: PluginCall) {
        if (ScreenCaptureHolder.isReady) {
            call.resolve(JSObject().put("started", true)); return
        }
        val activity = activity ?: return call.reject("No foreground Activity available")
        val mpm = activity.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(call, mpm.createScreenCaptureIntent(), "screenCaptureResult")
    }

    @ActivityCallback
    fun screenCaptureResult(call: PluginCall?, result: ActivityResult) {
        if (call == null) return
        if (result.resultCode != Activity.RESULT_OK || result.data == null) {
            call.reject("Screen capture permission denied"); return
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
        if (!canDrawOverlays()) return call.reject("Overlay permission not granted")
        val intent = Intent(context, FloatingOverlayService::class.java)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) context.startForegroundService(intent) else context.startService(intent)
        call.resolve(JSObject().put("running", true))
    }

    @PluginMethod
    fun stopOverlay(call: PluginCall) {
        context.stopService(Intent(context, FloatingOverlayService::class.java))
        call.resolve(JSObject().put("running", false))
    }

    @PluginMethod
    fun executeQuickJs(call: PluginCall) {
        val script = call.getString("script") ?: return call.reject("Missing 'script' parameter")
        if (!accessibilityReady()) return call.reject("Accessibility service not connected")
        
        QuickJsMacroRunner.execute(context, script, object : QuickJsMacroRunner.Listener {
            override fun onStarted() { notifyListeners("scriptStatus", JSObject().put("state", "running")) }
            override fun onLog(message: String) { notifyListeners("scriptLog", JSObject().put("message", message)) }
            override fun onCompleted() { notifyListeners("scriptStatus", JSObject().put("state", "completed")) }
            override fun onStopped() { notifyListeners("scriptStatus", JSObject().put("state", "stopped")) }
            override fun onError(message: String, stack: String?) {
                notifyListeners("scriptStatus", JSObject().apply { put("state", "error"); put("message", message) })
            }
        })
        call.resolve(JSObject().put("started", true))
    }

    @PluginMethod
    fun stopMacro(call: PluginCall) {
        QuickJsMacroRunner.stop()
        call.resolve()
    }

    @PluginMethod
    fun executePipeline(call: PluginCall) {
        val actionsJson = call.getString("actions") ?: return call.reject("Missing 'actions' parameter")
        val svc = MacroAccessibilityService.instance ?: return call.reject("Accessibility not connected")
        
        ioScope.launch {
            try {
                val array = JSONArray(actionsJson)
                notifyListeners("scriptStatus", JSObject().put("state", "running"))
                
                for (i in 0 until array.length()) {
                    val action = array.getJSONObject(i)
                    when (action.getString("type")) {
                        "tap" -> {
                            svc.performTap(action.getInt("x").toFloat(), action.getInt("y").toFloat(), 50L)
                            notifyListeners("scriptLog", JSObject().put("message", "Native Tap: ${action.getInt("x")}, ${action.getInt("y")}"))
                        }
                        "delay" -> delay(action.getInt("ms").toLong())
                        "log" -> notifyListeners("scriptLog", JSObject().put("message", action.getString("message")))
                    }
                }
                notifyListeners("scriptStatus", JSObject().put("state", "completed"))
            } catch (e: Exception) {
                notifyListeners("scriptStatus", JSObject().put("state", "error").put("message", e.message))
            }
        }
        call.resolve(JSObject().put("started", true))
    }
}
