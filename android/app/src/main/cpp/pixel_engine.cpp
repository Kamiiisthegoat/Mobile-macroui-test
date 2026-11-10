#include <jni.h>
#include <cstdint>
#include <cstdlib>
#include <cmath>
#include <algorithm>
#include <android/log.h>

#define LOG_TAG "MacroEngine"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace {

// RGBA_8888 memory layout: 4 bytes per pixel, order R,G,B,A.
// Returns ARGB jint (0xAARRGGBB).
jint nativeGetPixelColor(JNIEnv* env, jobject /*thiz*/,
                         jobject buffer, jint width, jint height,
                         jint rowStride, jint x, jint y) {
    if (buffer == nullptr) return 0;
    if (x < 0 || y < 0 || x >= width || y >= height) return 0;

    auto* base = static_cast<uint8_t*>(env->GetDirectBufferAddress(buffer));
    if (base == nullptr) return 0;

    const uint8_t* px = base + (static_cast<size_t>(y) * rowStride) + (static_cast<size_t>(x) * 4);
    return (static_cast<jint>(0xFF) << 24) |
           (static_cast<jint>(px[0]) << 16) |
           (static_cast<jint>(px[1]) << 8)  |
           (static_cast<jint>(px[2]));
}

// coordsAndColors: flat array, each 3 ints = one (x, y, ARGB_color) triplet.
jboolean nativeMatchMultiPixels(JNIEnv* env, jobject /*thiz*/,
                                jobject buffer, jint width, jint height,
                                jint rowStride, jintArray coordsAndColors,
                                jint tolerance) {
    if (buffer == nullptr || coordsAndColors == nullptr) return JNI_FALSE;

    auto* base = static_cast<uint8_t*>(env->GetDirectBufferAddress(buffer));
    if (base == nullptr) return JNI_FALSE;

    jsize len = env->GetArrayLength(coordsAndColors);
    if (len % 3 != 0) return JNI_FALSE;

    jint* data = env->GetIntArrayElements(coordsAndColors, nullptr);
    if (data == nullptr) return JNI_FALSE;

    jboolean allMatch = JNI_TRUE;
    for (jsize i = 0; i + 2 < len; i += 3) {
        jint x = data[i];
        jint y = data[i + 1];
        jint expected = data[i + 2];

        if (x < 0 || y < 0 || x >= width || y >= height) {
            allMatch = JNI_FALSE;
            break;
        }

        const uint8_t* px = base + (static_cast<size_t>(y) * rowStride) + (static_cast<size_t>(x) * 4);
        int er = (expected >> 16) & 0xFF;
        int eg = (expected >> 8)  & 0xFF;
        int eb =  expected        & 0xFF;

        if (std::abs(px[0] - er) > tolerance ||
            std::abs(px[1] - eg) > tolerance ||
            std::abs(px[2] - eb) > tolerance) {
            allMatch = JNI_FALSE;
            break;
        }
    }

    env->ReleaseIntArrayElements(coordsAndColors, data, JNI_ABORT);
    return allMatch;
}

// Returns (x << 16) | (y & 0xFFFF); -1 if not found.
jint nativeFindColorInRegion(JNIEnv* env, jobject /*thiz*/,
                             jobject buffer, jint width, jint height,
                             jint rowStride,
                             jint startX, jint startY,
                             jint endX, jint endY,
                             jint targetColor, jint tolerance) {
    if (buffer == nullptr) return -1;

    auto* base = static_cast<uint8_t*>(env->GetDirectBufferAddress(buffer));
    if (base == nullptr) return -1;

    int sx = std::max(0, static_cast<int>(startX));
    int sy = std::max(0, static_cast<int>(startY));
    int ex = std::min(static_cast<int>(width) - 1,  static_cast<int>(endX));
    int ey = std::min(static_cast<int>(height) - 1, static_cast<int>(endY));

    if (sx > ex || sy > ey) return -1;

    int tr = (targetColor >> 16) & 0xFF;
    int tg = (targetColor >> 8)  & 0xFF;
    int tb =  targetColor        & 0xFF;

    for (int y = sy; y <= ey; ++y) {
        for (int x = sx; x <= ex; ++x) {
            const uint8_t* px = base + (static_cast<size_t>(y) * rowStride) + (static_cast<size_t>(x) * 4);
            if (std::abs(px[0] - tr) <= tolerance &&
                std::abs(px[1] - tg) <= tolerance &&
                std::abs(px[2] - tb) <= tolerance) {
                return static_cast<jint>((x << 16) | (y & 0xFFFF));
            }
        }
    }
    return -1;
}

const JNINativeMethod kMethods[] = {
    {"getPixelColor",      "(Ljava/nio/ByteBuffer;IIIII)I",                         reinterpret_cast<void*>(nativeGetPixelColor)},
    {"matchMultiPixels",   "(Ljava/nio/ByteBuffer;III[II)Z",                        reinterpret_cast<void*>(nativeMatchMultiPixels)},
    {"findColorInRegion",  "(Ljava/nio/ByteBuffer;IIIIIIIII)I",                     reinterpret_cast<void*>(nativeFindColorInRegion)},
};

} // namespace

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void* /*reserved*/) {
    JNIEnv* env = nullptr;
    if (vm->GetEnv(reinterpret_cast<void**>(&env), JNI_VERSION_1_6) != JNI_OK) {
        LOGE("JNI_OnLoad: GetEnv failed");
        return JNI_ERR;
    }

    jclass clazz = env->FindClass("com/kamii/macroexecutor/NativePixelEngine");
    if (clazz == nullptr) {
        LOGE("JNI_OnLoad: NativePixelEngine class not found");
        return JNI_ERR;
    }

    if (env->RegisterNatives(clazz, kMethods,
                             sizeof(kMethods) / sizeof(kMethods[0])) < 0) {
        LOGE("JNI_OnLoad: RegisterNatives failed");
        return JNI_ERR;
    }

    LOGI("JNI_OnLoad: macroengine loaded, %zu methods registered",
         sizeof(kMethods) / sizeof(kMethods[0]));
    return JNI_VERSION_1_6;
}
