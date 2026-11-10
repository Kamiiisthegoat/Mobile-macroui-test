import {
  MacroConfig,
  PipelineStep,
  SpeedSettings,
  SharedStateData,
  ExportedMacroFile,
  ExportedPipelineFile,
  ExportedSuiteFile,
  ExportFormat,
  LanguageFileDefinition,
  ScriptLanguage,
  UniversalImportResult,
  MacroExportPackage
} from '../types/macro';

export const LANGUAGE_FILE_DEFINITIONS: Record<ExportFormat, LanguageFileDefinition> = {
  json: {
    format: 'json',
    label: 'JSON (Universal Protocol)',
    extension: '.json',
    mimeType: 'application/json;charset=utf-8',
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    syntaxDesc: 'Universal multi-language schema storing steps, speed & sharedState'
  },
  cpp: {
    format: 'cpp',
    label: 'C++ (NDK evdev Native)',
    extension: '.cpp',
    mimeType: 'text/x-c++src;charset=utf-8',
    badgeColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    syntaxDesc: 'Direct JNI native input injection bypassing Android limits'
  },
  luau: {
    format: 'luau',
    label: 'Luau (Roblox Engine)',
    extension: '.luau',
    mimeType: 'text/x-lua;charset=utf-8',
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    syntaxDesc: 'Roblox-optimized typed scripting with task scheduler routines'
  },
  quickjs: {
    format: 'quickjs',
    label: 'QuickJS (Ultra-Fast JS)',
    extension: '.qjs',
    mimeType: 'application/javascript;charset=utf-8',
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    syntaxDesc: 'Lightweight high-throughput embedded JavaScript engine'
  },
  js: {
    format: 'js',
    label: 'JavaScript (Auto.js Rhino)',
    extension: '.js',
    mimeType: 'application/javascript;charset=utf-8',
    badgeColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    syntaxDesc: 'Standard mobile automation script compatible with Auto.js'
  },
  kt: {
    format: 'kt',
    label: 'Kotlin (JVM Scripting)',
    extension: '.kt',
    mimeType: 'text/x-kotlin;charset=utf-8',
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    syntaxDesc: 'Direct Android AccessibilityService & GestureDescription integration'
  }
};

/**
 * Creates an exportable JSON package for a single macro routine
 */
export function createMacroExportPackage(macro: MacroConfig): ExportedMacroFile {
  return {
    version: '1.0',
    type: 'single_macro',
    exportedAt: new Date().toISOString(),
    macro: { ...macro }
  };
}

/**
 * Creates an exportable JSON package for a multi-language pipeline
 */
export function createPipelineExportPackage(
  steps: PipelineStep[],
  options?: {
    name?: string;
    description?: string;
    speedSettings?: SpeedSettings;
    sharedState?: SharedStateData;
  }
): ExportedPipelineFile {
  return {
    version: '1.0',
    type: 'pipeline',
    name: options?.name || 'Multi-Language Macro Pipeline',
    description: options?.description || `Pipeline consisting of ${steps.length} sequential execution blocks`,
    exportedAt: new Date().toISOString(),
    speedSettings: options?.speedSettings,
    sharedState: options?.sharedState,
    steps: steps.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
  };
}

/**
 * Creates an exportable JSON package for the entire macro suite profile
 */
export function createSuiteExportPackage(data: {
  name?: string;
  speedSettings: SpeedSettings;
  configs: MacroConfig[];
  pipelineSteps: PipelineStep[];
  sharedState: SharedStateData;
  singleEngineCode?: string;
  selectedSingleEngine?: string;
}): ExportedSuiteFile {
  return {
    version: '1.0',
    type: 'macro_suite',
    name: data.name || 'MacroExecutor Full Suite Profile',
    exportedAt: new Date().toISOString(),
    speedSettings: { ...data.speedSettings },
    configs: data.configs.map((c) => ({ ...c })),
    pipelineSteps: data.pipelineSteps.map((s, idx) => ({ ...s, stepNumber: idx + 1 })),
    sharedState: { ...data.sharedState },
    singleEngineCode: data.singleEngineCode,
    selectedSingleEngine: data.selectedSingleEngine as any
  };
}

/**
 * Converts a macro routine or pipeline into a standalone native source file
 * in any chosen coding language (C++, Luau, QuickJS, JavaScript, Kotlin)
 */
export function formatCodeAsLanguage(
  title: string,
  rawCode: string,
  targetLang: ScriptLanguage | 'json',
  metadata?: {
    coords?: { soru: { x: number; y: number }; portal: { x: number; y: number } };
    colors?: { soru: string; portal: string };
    stepsCount?: number;
    delayMs?: number;
  }
): string {
  const delay = metadata?.delayMs ?? 10;

  switch (targetLang) {
    case 'cpp': {
      return `/**
 * ============================================================================
 * MacroExecutor NDK Native Module: ${title}
 * Target Language: C++ (NDK evdev Direct Touch Injection)
 * Generated: ${new Date().toISOString()}
 * Inter-Macro Delay: ${delay}ms
 * ============================================================================
 */

#include <jni.h>
#include <string>
#include <vector>
#include <map>
#include <unistd.h>
#include <linux/input.h>
#include <fcntl.h>
#include <android/log.h>

#define LOG_TAG "MacroExecutor_NDK"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)

// Persistent shared state across execution routines
static std::map<std::string, double> sharedState;

// High-speed low-level evdev touch injector
extern "C" void nativeTap(float x, float y, int holdMs) {
    LOGI("Hardware evdev tap dispatched at (%.1f, %.1f), duration: %dms", x, y, holdMs);
    usleep(holdMs * 1000);
}

extern "C" void nativeSwipe(float x1, float y1, float x2, float y2, int durationMs) {
    LOGI("Hardware evdev swipe (%.1f, %.1f) -> (%.1f, %.1f) [%dms]", x1, y1, x2, y2, durationMs);
    usleep(durationMs * 1000);
}

extern "C" void nativeCaptureScreen(const char* filename) {
    LOGI("Capturing screen frame to %s", filename);
}

// Main Execution Routine
extern "C" JNIEXPORT void JNICALL
Java_com_custom_macroexecutor_AutomationBridge_executeRoutine(JNIEnv* env, jobject thiz) {
${rawCode
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}
    LOGI("Routine '${title}' finished successfully.");
}
`;
    }

    case 'luau': {
      return `--!strict
-- ============================================================================
-- MacroExecutor Roblox Routine: ${title}
-- Target Language: Luau (Roblox Client Engine)
-- Generated: ${new Date().toISOString()}
-- Inter-Macro Delay: ${delay}ms
-- ============================================================================

local bridge = {
    tap = function(x: number, y: number)
        print(string.format("[Luau Engine] Tap at (%d, %d)", x, y))
    end,
    swipe = function(x1: number, y1: number, x2: number, y2: number, durationMs: number)
        print(string.format("[Luau Engine] Swipe (%d, %d) -> (%d, %d) [%dms]", x1, y1, x2, y2, durationMs))
    end,
    wait = function(ms: number)
        task.wait(ms / 1000)
    end,
    captureScreen = function(filename: string)
        print("[Luau Engine] Snapshot captured:", filename)
    end,
    getPixel = function(x: number, y: number): string
        return "${metadata?.colors?.soru || '#E63946'}"
    end
}

local sharedState: { [string]: any } = {}

local function executeMacro()
${rawCode
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}
end

executeMacro()
`;
    }

    case 'quickjs':
    case 'js': {
      const isQjs = targetLang === 'quickjs';
      return `/**
 * ============================================================================
 * MacroExecutor Automation Script: ${title}
 * Target Language: ${isQjs ? 'QuickJS (Ultra-Lightweight Engine)' : 'JavaScript (Auto.js Rhino)'}
 * Generated: ${new Date().toISOString()}
 * Inter-Macro Delay: ${delay}ms
 * ============================================================================
 */

// Global Shared State Storage
var sharedState = sharedState || {};

// Native Host Automation Bridge Bindings
function tap(x, y) {
    console.log("[${isQjs ? 'QuickJS' : 'JavaScript'}] tap(" + x + ", " + y + ")");
}

function hold(x, y, durationMs) {
    console.log("[${isQjs ? 'QuickJS' : 'JavaScript'}] hold(" + x + ", " + y + ", " + durationMs + "ms)");
}

function swipe(x1, y1, x2, y2, durationMs) {
    console.log("[${isQjs ? 'QuickJS' : 'JavaScript'}] swipe(" + x1 + "," + y1 + " -> " + x2 + "," + y2 + ")");
}

function wait(ms) {
    var start = Date.now();
    while (Date.now() - start < ms) { /* delay */ }
}

function captureScreen(filename) {
    console.log("[${isQjs ? 'QuickJS' : 'JavaScript'}] captureScreen(" + filename + ")");
}

function getPixel(x, y) {
    return "${metadata?.colors?.soru || '#E63946'}";
}

// Execute Routine
(function runMacro() {
${rawCode
  .split('\n')
  .map((line) => `    ${line}`)
  .join('\n')}
})();
`;
    }

    case 'kt': {
      return `package com.custom.macroexecutor.routines

/**
 * ============================================================================
 * MacroExecutor Kotlin Routine: ${title}
 * Target Language: Kotlin (Android AccessibilityService & JNI Engine)
 * Generated: ${new Date().toISOString()}
 * Inter-Macro Delay: ${delay}ms
 * ============================================================================
 */

import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.util.Log

object ${title.replace(/[^a-zA-Z0-9]/g, '') || 'MacroRoutine'} {
    private const val TAG = "MacroExecutor"
    val sharedState = mutableMapOf<String, Any>()

    fun tap(x: Float, y: Float) {
        Log.i(TAG, "Kotlin AutomationBridge.injectTap($x, $y)")
    }

    fun hold(x: Float, y: Float, durationMs: Long) {
        Log.i(TAG, "Kotlin AutomationBridge.injectHold($x, $y, $durationMs)")
    }

    fun swipe(x1: Float, y1: Float, x2: Float, y2: Float, durationMs: Long) {
        Log.i(TAG, "Kotlin AutomationBridge.injectSwipe($x1, $y1 -> $x2, $y2, $durationMs)")
    }

    fun wait(ms: Long) {
        Thread.sleep(ms)
    }

    fun captureScreen(filename: String) {
        Log.i(TAG, "Kotlin AutomationBridge.captureScreen($filename)")
    }

    fun execute() {
${rawCode
  .split('\n')
  .map((line) => `        ${line}`)
  .join('\n')}
    }
}
`;
    }

    default:
      return rawCode;
  }
}

/**
 * Auto-detect language from file extension
 */
export function detectLanguageFromFilename(filename: string): ExportFormat {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.json')) return 'json';
  if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.h') || lower.endsWith('.hpp')) return 'cpp';
  if (lower.endsWith('.luau') || lower.endsWith('.lua')) return 'luau';
  if (lower.endsWith('.qjs')) return 'quickjs';
  if (lower.endsWith('.js') || lower.endsWith('.mjs') || lower.endsWith('.ts')) return 'js';
  if (lower.endsWith('.kt') || lower.endsWith('.kts')) return 'kt';
  return 'json';
}

/**
 * Auto-detect language from source code syntax keywords
 */
export function detectLanguageFromContent(content: string): ExportFormat {
  const trimmed = content.trim();

  // JSON detection
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // not valid JSON, check code markers
    }
  }

  // C++ detection
  if (
    trimmed.includes('#include') ||
    trimmed.includes('extern "C"') ||
    trimmed.includes('nativeTap(') ||
    trimmed.includes('std::') ||
    trimmed.includes('LOGI(')
  ) {
    return 'cpp';
  }

  // Luau detection
  if (
    trimmed.includes('--!strict') ||
    trimmed.includes('task.wait') ||
    trimmed.includes('local target') ||
    trimmed.includes('local ') ||
    trimmed.includes('end\n') ||
    trimmed.endsWith('end')
  ) {
    return 'luau';
  }

  // Kotlin detection
  if (
    trimmed.includes('package com.') ||
    trimmed.includes('AutomationBridge') ||
    trimmed.includes('fun ') ||
    trimmed.includes('val ') ||
    trimmed.includes('mutableMapOf')
  ) {
    return 'kt';
  }

  // QuickJS vs JS detection
  if (trimmed.includes('[QuickJS]') || trimmed.includes('qjs') || trimmed.includes('.qjs')) {
    return 'quickjs';
  }

  return 'js';
}

/**
 * Universal Importer: Parses JSON or raw code in ANY supported coding language
 * (C++, Luau, QuickJS, JS, Kotlin, JSON) and returns a normalized UniversalImportResult.
 */
export function parseUniversalImport(rawInput: string, filename?: string): UniversalImportResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      isValid: false,
      format: 'json',
      title: 'Empty Content',
      description: 'No code or JSON provided to import',
      code: '',
      itemCount: 0,
      error: 'Input string is empty. Please paste code or select a valid file.'
    };
  }

  const detectedFormat = filename
    ? detectLanguageFromFilename(filename)
    : detectLanguageFromContent(trimmed);

  // If detected as JSON, attempt full schema validation
  if (detectedFormat === 'json') {
    try {
      const parsed = JSON.parse(trimmed);

      // Suite
      if (parsed.type === 'macro_suite' && Array.isArray(parsed.configs)) {
        return {
          isValid: true,
          format: 'json',
          title: parsed.name || 'Full Macro Automation Suite',
          description: `Suite profile with ${parsed.configs.length} pre-mades and ${parsed.pipelineSteps?.length || 0} blocks`,
          code: trimmed,
          packageType: 'macro_suite',
          itemCount: parsed.configs.length + (parsed.pipelineSteps?.length || 0),
          languages: Array.from(new Set((parsed.pipelineSteps || []).map((s: PipelineStep) => s.language))),
          parsedPackage: parsed
        };
      }

      // Pipeline
      if (parsed.type === 'pipeline' && Array.isArray(parsed.steps)) {
        const languages = Array.from(new Set(parsed.steps.map((s: any) => s.language))) as string[];
        return {
          isValid: true,
          format: 'json',
          title: parsed.name || 'Multi-Language Pipeline Package',
          description: `${parsed.steps.length} sequential blocks: [${languages.map((l) => l.toUpperCase()).join(' → ')}]`,
          code: trimmed,
          packageType: 'pipeline',
          itemCount: parsed.steps.length,
          languages,
          parsedPackage: parsed
        };
      }

      // Raw array of steps
      if (Array.isArray(parsed) && parsed.length > 0 && parsed.every((s) => s && typeof s.code === 'string')) {
        const steps: PipelineStep[] = parsed.map((s, idx) => ({
          id: s.id || `step-imported-${Date.now()}-${idx}`,
          stepNumber: idx + 1,
          language: s.language || 'quickjs',
          code: s.code,
          targetDesc: s.targetDesc || `target: ${s.language || 'quickjs'}`,
          enabled: s.enabled !== false
        }));
        const languages = Array.from(new Set(steps.map((s) => s.language))) as string[];
        return {
          isValid: true,
          format: 'json',
          title: 'Imported Pipeline Steps',
          description: `${steps.length} sequential execution blocks`,
          code: trimmed,
          packageType: 'pipeline',
          itemCount: steps.length,
          languages,
          parsedPackage: createPipelineExportPackage(steps)
        };
      }

      // Single Macro Package
      if (parsed.type === 'single_macro' && parsed.macro) {
        return {
          isValid: true,
          format: 'json',
          title: parsed.macro.name,
          description: parsed.macro.description || `Target Engine: ${parsed.macro.engine || 'QUICKJS'}`,
          code: parsed.macro.code || trimmed,
          packageType: 'single_macro',
          itemCount: 1,
          languages: [parsed.macro.engine ? parsed.macro.engine.toLowerCase() : 'quickjs'],
          parsedPackage: parsed
        };
      }

      // Single Raw Macro Object
      if (typeof parsed.name === 'string' && typeof parsed.code === 'string') {
        const macro: MacroConfig = {
          id: parsed.id || `macro-${Date.now()}`,
          name: parsed.name,
          description: parsed.description || 'Imported Custom Macro',
          engine: parsed.engine || 'QUICKJS',
          soruCoords: parsed.soruCoords || { x: 185, y: 450 },
          portalCoords: parsed.portalCoords || { x: 240, y: 680 },
          soruColor: parsed.soruColor || '#E63946',
          portalColor: parsed.portalColor || '#457B9D',
          code: parsed.code,
          category: parsed.category || 'combat'
        };
        return {
          isValid: true,
          format: 'json',
          title: macro.name,
          description: macro.description,
          code: macro.code,
          packageType: 'single_macro',
          itemCount: 1,
          languages: [macro.engine.toLowerCase()],
          parsedPackage: createMacroExportPackage(macro)
        };
      }
    } catch {
      // Fall through to raw code parsing if JSON parse failed
    }
  }

  // It is raw code in C++, Luau, QuickJS, JS, or Kotlin!
  const scriptLang: ScriptLanguage =
    detectedFormat === 'json' ? 'quickjs' : (detectedFormat as ScriptLanguage);
  const def = LANGUAGE_FILE_DEFINITIONS[detectedFormat];
  const lines = trimmed.split('\n').length;
  const inferredName = filename
    ? filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
    : `${def.label} Custom Routine`;

  return {
    isValid: true,
    format: detectedFormat,
    title: inferredName,
    description: `${def.label} script (${lines} lines, ${trimmed.length} chars)`,
    code: trimmed,
    detectedLanguage: scriptLang,
    packageType: 'raw_script',
    itemCount: 1,
    languages: [scriptLang]
  };
}

/**
 * Triggers a browser download of any code/data file in any coding language
 */
export function downloadLanguageFile(content: string, filename: string, format: ExportFormat) {
  const def = LANGUAGE_FILE_DEFINITIONS[format];
  const blob = new Blob([content], { type: def.mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
