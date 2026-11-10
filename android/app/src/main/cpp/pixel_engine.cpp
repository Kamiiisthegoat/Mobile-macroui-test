#include <jni.h>
#include <cstdint>
#include <algorithm>
#include <android/log.h>

#define LOG_TAG "MacroEngine"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

static inline int32_t packRGBA(uint8_t r, uint8_t g, uint8_t b) {
    return (0xFF << 24) | (r << 16) | (g << 8) | b;
}

static inline bool channelMatch(uint8_t c1, uint8_t c2, int tolerance) {
    return std::abs((int)c1 - (int)c2) <= tolerance;
}

extern "C" {

JNIEXPORT jint JNICALL
Java_com_kamii_macroexecutor_NativePixelEngine_getPixelColor(
        JNIEnv* env, jobject /*this*/,
        jobject buffer, jint width, jint height, jint rowStride, jint x, jint y) {
    if (x < 0 || x >= width || y < 0 || y >= height) return 0;
    uint8_t* data = (uint8_t*)env->GetDirectBufferAddress(buffer);
    if (!data) return 0;
    int offset = y * rowStride + x * 4;
    if (offset + 3 >= width * height * 4) return 0;
    return packRGBA(data[offset], data[offset+1], data[offset+2]);
}

JNIEXPORT jboolean JNICALL
Java_com_kamii_macroexecutor_NativePixelEngine_matchMultiPixels(
        JNIEnv* env, jobject /*this*/,
        jobject buffer, jint width, jint height, jint rowStride,
        jintArray coordsAndColors, jint tolerance) {
    jsize len = env->GetArrayLength(coordsAndColors);
    if (len % 3 != 0) return JNI_FALSE;
    jint* arr = env->GetIntArrayElements(coordsAndColors, nullptr);
    if (!arr) return JNI_FALSE;
    uint8_t* data = (uint8_t*)env->GetDirectBufferAddress(buffer);
    if (!data) { env->ReleaseIntArrayElements(coordsAndColors, arr, JNI_ABORT); return JNI_FALSE; }

    jboolean result = JNI_TRUE;
    for (jsize i = 0; i < len; i += 3) {
        jint x = arr[i], y = arr[i+1], color = arr[i+2];
        if (x < 0 || x >= width || y < 0 || y >= height) { result = JNI_FALSE; break; }
        int offset = y * rowStride + x * 4;
        if (offset + 3 >= width * height * 4) { result = JNI_FALSE; break; }

        uint8_t r = (color >> 16) & 0xFF, g = (color >> 8) & 0xFF, b = color & 0xFF;
        if (!channelMatch(data[offset], r, tolerance) ||
            !channelMatch(data[offset+1], g, tolerance) ||
            !channelMatch(data[offset+2], b, tolerance)) {
            result = JNI_FALSE; break;
        }
    }
    env->ReleaseIntArrayElements(coordsAndColors, arr, JNI_ABORT);
    return result;
}

JNIEXPORT jlong JNICALL
Java_com_kamii_macroexecutor_NativePixelEngine_findColorInRegion(
        JNIEnv* env, jobject /*this*/,
        jobject buffer, jint width, jint height, jint rowStride,
        jint startX, jint startY, jint endX, jint endY,
        jint targetColor, jint tolerance) {
    uint8_t* data = (uint8_t*)env->GetDirectBufferAddress(buffer);
    if (!data) return -1L;

    startX = std::max(0, startX);
    startY = std::max(0, startY);
    endX = std::min((int)width - 1, endX);
    endY = std::min((int)height - 1, endY);

    uint8_t tr = (targetColor >> 16) & 0xFF, tg = (targetColor >> 8) & 0xFF, tb = targetColor & 0xFF;

    for (int y = startY; y <= endY; ++y) {
        for (int x = startX; x <= endX; ++x) {
            int offset = y * rowStride + x * 4;
            if (offset + 3 >= width * height * 4) continue;
            if (channelMatch(data[offset], tr, tolerance) &&
                channelMatch(data[offset+1], tg, tolerance) &&
                channelMatch(data[offset+2], tb, tolerance)) {
                return ((jlong)x << 32) | (y & 0xFFFFFFFFL);
            }
        }
    }
    return -1L;
}

} // extern "C"
