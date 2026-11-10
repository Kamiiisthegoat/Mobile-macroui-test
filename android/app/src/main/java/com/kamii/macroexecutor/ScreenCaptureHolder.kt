package com.kamii.macroexecutor

import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection

object ScreenCaptureHolder {

    @Volatile var mediaProjection: MediaProjection? = null
    @Volatile var virtualDisplay: VirtualDisplay? = null
    @Volatile var imageReader: ImageReader? = null

    @Volatile var width: Int = 0
    @Volatile var height: Int = 0
    @Volatile var rowStride: Int = 0

    fun isReady(): Boolean =
        imageReader != null && width > 0 && height > 0

    fun reset() {
        virtualDisplay?.release()
        imageReader?.close()
        mediaProjection?.stop()
        virtualDisplay = null
        imageReader = null
        mediaProjection = null
        width = 0
        height = 0
        rowStride = 0
    }
}
