import { MacroConfig, PipelineStep, ScriptLanguage } from '../types/macro';

export const INITIAL_PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    language: 'cpp',
    targetDesc: 'target: cpp',
    enabled: true,
    code: `// 1. High-speed NDK tap via JNI evdev
nativeTap(540.0f, 1120.0f, 25);
sharedState["lastTapX"] = 540;`
  },
  {
    id: 'step-2',
    stepNumber: 2,
    language: 'luau',
    targetDesc: 'target: luau',
    enabled: true,
    code: `-- 2. Typed Luau condition & delay check
local targetX = sharedState.lastTapX or 540
wait(120)
tap(targetX, 450)`
  },
  {
    id: 'step-3',
    stepNumber: 3,
    language: 'quickjs',
    targetDesc: 'target: quickjs',
    enabled: true,
    code: `// 3. QuickJS event completion & UI confirm
tap(200, 450);
console.log("Combined multi-language pipeline completed.");`
  }
];

export const DEFAULT_MACRO_CONFIGS: MacroConfig[] = [
  {
    id: 'soru-x',
    name: 'SORU X MACRO',
    description: 'Pre-made optimized routine for QUICKJS. High-speed flash-step combo for Blox Fruits with color verification.',
    engine: 'optimized routine for QUICKJS',
    soruCoords: { x: 185, y: 450 },
    portalCoords: { x: 240, y: 680 },
    soruColor: '#E63946',
    portalColor: '#457B9D',
    category: 'bloxfruits',
    code: `// Embedded QuickJS Ultra-Lightweight Soru X Routine
var soruX = 185;
var soruY = 450;
var portalX = 240;
var portalY = 680;

console.log("[QuickJS] Checking Soru icon ready state...");
if (getPixel(soruX, soruY) === "#E63946") {
    tap(soruX, soruY);
    wait(20);
    tap(portalX, portalY);
    wait(60);
    console.log("[QuickJS] Flash step combo executed successfully.");
} else {
    console.warn("[QuickJS] Soru cooldown active or color mismatch.");
}`
  }
];

export const SINGLE_ENGINE_TEMPLATES: Record<ScriptLanguage, string> = {
  quickjs: `// Embedded QuickJS Ultra-Lightweight Routine
var x = 200;
var y = 450;
console.log("[QuickJS] Running embedded script...");
tap(x, y);
wait(150);
for (var i = 0; i < 5; i++) {
    tap(x, y);
    wait(60);
}
swipe(195, 650, 195, 250, 300);`,

  js: `// Auto.js Rhino / Modern JS Routine
const primaryX = 220;
const primaryY = 480;

toast("MacroExecutor running JS script");
tap(primaryX, primaryY);
sleep(100);
for (let i = 0; i < 3; i++) {
    tap(primaryX, primaryY);
    sleep(75);
}`,

  luau: `-- Luau High-Performance Roblox Automation
local primaryX = 200
local primaryY = 450

print("[Luau] Initializing Roblox Blox Fruits macro...")
tap(primaryX, primaryY)
wait(150)
for i = 1, 5 do
    tap(primaryX, primaryY)
    wait(60)
end
swipe(195, 650, 195, 250, 300)`,

  cpp: `// C++ NDK Direct Kernel Input Injector
#include <unistd.h>

void execute() {
    float x = 200.0f;
    float y = 450.0f;
    nativeTap(x, y, 20);
    preciseSleep(100);
    for (int i = 0; i < 5; ++i) {
        nativeTap(x, y, 20);
        preciseSleep(50);
    }
}`,

  kt: `// Kotlin Scripting (kotlin-scripting-jvm)
val targetX = 200f
val targetY = 450f

AutomationBridge.dispatchTap(targetX, targetY, duration = 25L)
Thread.sleep(120L)
repeat(5) {
    AutomationBridge.dispatchTap(targetX, targetY, duration = 20L)
    Thread.sleep(60L)
}`
};
