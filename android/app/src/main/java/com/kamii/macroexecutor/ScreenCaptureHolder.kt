package com.kamii.macroexecutor

import android.hardware.display.VirtualDisplay
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.util.Log

object ScreenCaptureHolder {
    private const val TAG = "ScreenCaptureHolder"
    @Volatile var mediaProjection: MediaProjection? = null
    @Volatile var virtualDisplay: VirtualDisplay? = null
    @Volatile var imageReader: ImageReader? = null
    @Volatile var width: Int = 0
    @Volatile var height: Int = 0

    val isReady: Boolean get() = imageReader != null && width > 0 && height > 0

    fun setImageReader(reader: ImageReader, w: Int, h: Int) {
        imageReader = reader; width = w; height = h
    }

    fun reset() {
        runCatching { virtualDisplay?.release() }
        runCatching { imageReader?.close() }
        runCatching { mediaProjection?.stop() }
        virtualDisplay = null; imageReader = null; mediaProjection = null; width = 0; height = 0
    }

    fun getPixel(x: Int, y: Int): Int {
        val reader = imageReader ?: return 0
        val image = try { reader.acquireLatestImage() } catch (e: Exception) { return 0 } ?: return 0
        return try {
            val plane = image.planes[0]
            NativePixelEngine.getPixelColor(plane.buffer, image.width, image.height, plane.rowStride, x, y)
        } finally { runCatching { image.close() } }
    }

    fun match3x3(x: Int, y: Int, color: Int, tolerance: Int): Boolean {
        val reader = imageReader ?: return false
        val image = try { reader.acquireLatestImage() } catch (e: Exception) { return false } ?: return false
        return try {
            val plane = image.planes[0]
            NativePixelEngine.match3x3(plane.buffer, image.width, image.height, plane.rowStride, x, y, color, tolerance)
        } finally { runCatching { image.close() } }
    }

    fun matchPixels(triplets: IntArray, tolerance: Int): Boolean {
        if (triplets.isEmpty() || triplets.size % 3 != 0) return false
        val reader = imageReader ?: return false
        val image = try { reader.acquireLatestImage() } catch (e: Exception) { return false } ?: return false
        return try {
            val plane = image.planes[0]
            NativePixelEngine.matchMultiPixels(plane.buffer, image.width, image.height, plane.rowStride, triplets, tolerance)
        } finally { runCatching { image.close() } }
    }

    fun findColor(startX: Int, startY: Int, endX: Int, endY: Int, color: Int, tolerance: Int): Pair<Int, Int>? {
        val reader = imageReader ?: return null
        val image = try { reader.acquireLatestImage() } catch (e: Exception) { return null } ?: return null
        return try {
            val plane = image.planes[0]
            val packed = NativePixelEngine.findColorInRegion(plane.buffer, image.width, image.height, plane.rowStride, startX, startY, endX, endY, color, tolerance)
            if (packed == -1L) null else Pair((packed shr 32).toInt(), (packed and 0xFFFFFFFFL).toInt())
        } finally { runCatching { image.close() } }
    }
}
