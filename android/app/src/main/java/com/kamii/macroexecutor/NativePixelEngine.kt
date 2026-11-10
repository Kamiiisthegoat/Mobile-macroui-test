package com.kamii.macroexecutor

import java.nio.ByteBuffer

object NativePixelEngine {

    init {
        System.loadLibrary("macroengine")
    }

    external fun getPixelColor(
        buffer: ByteBuffer,
        width: Int,
        height: Int,
        rowStride: Int,
        x: Int,
        y: Int
    ): Int

    external fun matchMultiPixels(
        buffer: ByteBuffer,
        width: Int,
        height: Int,
        rowStride: Int,
        coordsAndColors: IntArray,
        tolerance: Int
    ): Boolean

    external fun findColorInRegion(
        buffer: ByteBuffer,
        width: Int,
        height: Int,
        rowStride: Int,
        startX: Int,
        startY: Int,
        endX: Int,
        endY: Int,
        targetColor: Int,
        tolerance: Int
    ): Int
}
