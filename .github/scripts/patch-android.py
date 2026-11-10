#!/usr/bin/env python3
"""
Patch Capacitor-generated Gradle files for Kotlin, NDK/CMake, and custom deps.
Idempotent: safe to re-run.
"""
import re
import sys

KOTLIN_VERSION = "1.9.22"
QUICKJS_COORD = "io.github.taoweiji.quickjs:quickjs-android:1.4.6"
NDK_VERSION    = "26.1.10909125"
CMAKE_VERSION  = "3.22.1"


def log(msg):
    print(msg)


# ---------- 1. ROOT build.gradle: add Kotlin Gradle Plugin classpath ----------
root_path = "android/build.gradle"
with open(root_path) as f:
    root = f.read()

if "kotlin-gradle-plugin" not in root:
    pattern = re.compile(
        r"classpath\s+(['\"])com\.android\.tools\.build:gradle[^'\"]+\1"
    )
    match = pattern.search(root)
    if not match:
        sys.exit("❌ Could not locate com.android.tools.build:gradle classpath")
    replacement = (
        f"classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:{KOTLIN_VERSION}'\n"
        f"        {match.group(0)}"
    )
    root = root[:match.start()] + replacement + root[match.end():]
    with open(root_path, "w") as f:
        f.write(root)
    log("✓ Root build.gradle: kotlin-gradle-plugin classpath added")
else:
    log("→ Root build.gradle: kotlin-gradle-plugin already present")


# ---------- 2. APP build.gradle ----------
app_path = "android/app/build.gradle"
with open(app_path) as f:
    app = f.read()

# 2a. Apply Kotlin plugin
if "kotlin-android" not in app:
    marker = "apply plugin: 'com.android.application'"
    if marker not in app:
        sys.exit("❌ Could not locate 'apply plugin' in app/build.gradle")
    app = app.replace(
        marker,
        marker + "\napply plugin: 'kotlin-android'",
        1,
    )
    log("✓ App build.gradle: 'kotlin-android' plugin applied")

# 2b. Detect Java target so Kotlin's jvmTarget matches
m = re.search(r"sourceCompatibility\s+(?:JavaVersion\.)?VERSION_(\d+)", app)
java_target = m.group(1) if m else "21"
log(f"→ Detected Java compile target: {java_target}")

# 2c. Inject NDK / CMake / kotlinOptions into the existing android { } block
if "externalNativeBuild" not in app:
    idx = app.find("android {")
    if idx < 0:
        sys.exit("❌ Could not locate 'android {' in app/build.gradle")
    insert_at = idx + len("android {")
    injection = f"""
    ndkVersion "{NDK_VERSION}"
    externalNativeBuild {{
        cmake {{
            path "src/main/cpp/CMakeLists.txt"
            version "{CMAKE_VERSION}"
        }}
    }}
    kotlinOptions {{
        jvmTarget = "{java_target}"
    }}"""
    app = app[:insert_at] + injection + app[insert_at:]
    log("✓ App build.gradle: NDK + CMake + kotlinOptions injected")

# 2d. Append custom dependencies
if "quickjs-android" not in app:
    app += f"""

dependencies {{
    implementation(platform("org.jetbrains.kotlin:kotlin-bom:{KOTLIN_VERSION}"))
    implementation '{QUICKJS_COORD}'
}}
"""
    log("✓ App build.gradle: QuickJS + Kotlin BOM dependencies appended")

with open(app_path, "w") as f:
    f.write(app)

log("\n✅ Android Gradle patching complete.")
