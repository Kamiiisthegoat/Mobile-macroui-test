import { PipelineStep, ScriptLanguage, SharedStateData, SpeedSettings, TerminalLog } from '../types/macro';

/**
 * Calculates execution delay with optional ±20% jitter for anti-cheat human simulation
 */
export function calculateEffectiveDelay(baseDelayMs: number, applyJitter: boolean): number {
  if (!applyJitter || baseDelayMs <= 0) {
    return Math.max(1, Math.round(baseDelayMs));
  }
  // Random jitter between -20% and +20%
  const jitterFactor = 0.8 + Math.random() * 0.4;
  return Math.max(1, Math.round(baseDelayMs * jitterFactor));
}

/**
 * Generates language-specific syntax snippets for quick macro action insertion
 */
export function generateSnippet(action: 'tap' | 'hold' | 'swipe' | 'wait' | 'loop' | 'snapshot', lang: ScriptLanguage, coords?: { x: number; y: number }): string {
  const x = coords?.x ?? 540;
  const y = coords?.y ?? 1120;

  switch (lang) {
    case 'cpp':
      switch (action) {
        case 'tap':
          return `// High-speed NDK tap via JNI evdev\nnativeTap(${x}.0f, ${y}.0f, 25);\nsharedState["lastTapX"] = ${x};`;
        case 'hold':
          return `// JNI NDK prolonged touch\nnativeHold(${x}.0f, ${y}.0f, 800);\nsharedState["lastHoldDuration"] = 800;`;
        case 'swipe':
          return `// Direct kernel evdev swipe vector\nnativeSwipe(${x}, ${y}, ${x}, ${y - 400}, 150);`;
        case 'wait':
          return `// High-precision nanosecond sleep\npreciseSleep(120);`;
        case 'loop':
          return `// Unrolled SIMD loop\nfor(int i = 0; i < 5; ++i) {\n    nativeTap(${x}.0f, ${y}.0f, 20);\n    preciseSleep(50);\n}`;
        case 'snapshot':
          return `// Capture hardware framebuffer picture\nstd::string snap = captureScreenBuffer("snap_${Date.now()}.png");\nsharedState["lastPicture"] = snap.c_str();`;
      }
      break;

    case 'luau':
      switch (action) {
        case 'tap':
          return `-- Typed Luau tap\nlocal targetX = sharedState.lastTapX or ${x}\ntap(targetX, ${y})\nsharedState.lastTapX = targetX`;
        case 'hold':
          return `-- Luau touch hold routine\nhold(${x}, ${y}, 750)`;
        case 'swipe':
          return `-- Blox Fruits directional camera swipe\nswipe(${x}, ${y}, ${x}, ${y - 350}, 120)`;
        case 'wait':
          return `wait(120)`;
        case 'loop':
          return `-- Roblox frame-synchronized loop\nfor i = 1, 5 do\n    tap(${x}, ${y})\n    wait(60)\nend`;
        case 'snapshot':
          return `-- Take game frame screenshot\nlocal picturePath = takeScreenshot("snap_${Date.now()}.png")\nsharedState.lastPicture = picturePath`;
      }
      break;

    case 'quickjs':
    case 'js':
      switch (action) {
        case 'tap':
          return `// QuickJS ultra-lightweight tap\ntap(${x}, ${y});\nsharedState.lastTapX = ${x};`;
        case 'hold':
          return `// QuickJS hold gesture\nhold(${x}, ${y}, 700);`;
        case 'swipe':
          return `// GestureDescription swipe\nswipe(${x}, ${y}, ${x}, ${y - 300}, 200);`;
        case 'wait':
          return `wait(150);`;
        case 'loop':
          return `// Repeat action sequence\nfor (let i = 0; i < 5; i++) {\n    tap(${x}, ${y});\n    wait(60);\n}`;
        case 'snapshot':
          return `// Capture screen picture\nvar pic = captureScreen("screenshot_${Date.now()}.png");\nsharedState.lastPicture = pic;`;
      }
      break;

    case 'kt':
      switch (action) {
        case 'tap':
          return `// Kotlin Scripting direct AccessibilityService tap\nAutomationBridge.dispatchTap(${x}f, ${y}f, duration = 25L)\nsharedState["lastTapX"] = ${x}`;
        case 'hold':
          return `// Kotlin gesture hold\nAutomationBridge.dispatchHold(${x}f, ${y}f, duration = 750L)`;
        case 'swipe':
          return `// Direct Accessibility GestureDescription\nAutomationBridge.dispatchSwipe(startX = ${x}f, startY = ${y}f, endX = ${x}f, endY = ${y - 350}f, 180L)`;
        case 'wait':
          return `delay(120L)`;
        case 'loop':
          return `repeat(5) {\n    AutomationBridge.dispatchTap(${x}f, ${y}f, 20L)\n    delay(50L)\n}`;
        case 'snapshot':
          return `// Take screenshot via MediaProjection\nval pic = AutomationBridge.takeScreenPicture("snap_${Date.now()}.png")\nsharedState["lastPicture"] = pic`;
      }
      break;
  }
  return `tap(${x}, ${y});`;
}

/**
 * Extracts and mutates sharedState keys based on script text
 */
export function extractSharedStateMutations(code: string, currentState: SharedStateData): { updatedState: SharedStateData; mutations: Array<{ key: string; value: string | number | boolean }> } {
  const updated = { ...currentState };
  const mutations: Array<{ key: string; value: string | number | boolean }> = [];

  // Match: sharedState["key"] = 123 or sharedState.key = 123 or sharedState.key = "abc"
  const bracketRegex = /sharedState\[["']([a-zA-Z0-9_]+)["']\]\s*=\s*([^;\n]+)/g;
  const dotRegex = /sharedState\.([a-zA-Z0-9_]+)\s*=\s*([^;\n]+)/g;

  let match: RegExpExecArray | null;
  while ((match = bracketRegex.exec(code)) !== null) {
    const key = match[1];
    const rawVal = match[2].trim();
    let parsedVal: string | number | boolean = rawVal;
    if (!isNaN(Number(rawVal))) {
      parsedVal = Number(rawVal);
    } else if (rawVal === 'true') {
      parsedVal = true;
    } else if (rawVal === 'false') {
      parsedVal = false;
    } else {
      parsedVal = rawVal.replace(/^["']|["']$/g, '');
    }
    updated[key] = parsedVal;
    mutations.push({ key, value: parsedVal });
  }

  while ((match = dotRegex.exec(code)) !== null) {
    const key = match[1];
    const rawVal = match[2].trim();
    let parsedVal: string | number | boolean = rawVal;
    if (!isNaN(Number(rawVal))) {
      parsedVal = Number(rawVal);
    } else if (rawVal === 'true') {
      parsedVal = true;
    } else if (rawVal === 'false') {
      parsedVal = false;
    } else {
      parsedVal = rawVal.replace(/^["']|["']$/g, '');
    }
    updated[key] = parsedVal;
    mutations.push({ key, value: parsedVal });
  }

  return { updatedState: updated, mutations };
}

/**
 * Scans code for tap/swipe gestures to produce simulated execution telemetry
 */
export function extractGestures(code: string): Array<{ type: 'tap' | 'swipe' | 'hold'; x: number; y: number; extra?: string }> {
  const gestures: Array<{ type: 'tap' | 'swipe' | 'hold'; x: number; y: number; extra?: string }> = [];

  // nativeTap(540.0f, 1120.0f, 25) or tap(200, 450)
  const tapRegex = /(?:nativeTap|tap|dispatchTap)\s*\(\s*(\d+(?:\.\d+)?)[fF]?\s*,\s*(\d+(?:\.\d+)?)[fF]?(?:.*?(\d+)(?:ms|L)?)?\s*\)/g;
  let tapMatch: RegExpExecArray | null;
  while ((tapMatch = tapRegex.exec(code)) !== null) {
    gestures.push({
      type: 'tap',
      x: Math.round(parseFloat(tapMatch[1])),
      y: Math.round(parseFloat(tapMatch[2])),
      extra: tapMatch[3] ? `${tapMatch[3]}ms` : '25ms'
    });
  }

  // swipe(x1, y1, x2, y2, duration)
  const swipeRegex = /(?:nativeSwipe|swipe|dispatchSwipe)\s*\(\s*(\d+).*?,\s*(\d+).*?,\s*(\d+).*?,\s*(\d+)(?:.*?(\d+))?\s*\)/g;
  let swipeMatch: RegExpExecArray | null;
  while ((swipeMatch = swipeRegex.exec(code)) !== null) {
    gestures.push({
      type: 'swipe',
      x: parseInt(swipeMatch[1], 10),
      y: parseInt(swipeMatch[2], 10),
      extra: `to (${swipeMatch[3]}, ${swipeMatch[4]})`
    });
  }

  return gestures;
}

/**
 * Executes a single pipeline step for step-by-step visual debugging
 */
export function executeStepDebugger(
  step: PipelineStep,
  currentState: SharedStateData,
  speedSettings: SpeedSettings,
  stepIndex: number,
  baseOffsetMs: number = 0
): {
  updatedState: SharedStateData;
  logs: TerminalLog[];
  elapsedMs: number;
  gestures: Array<{ type: 'tap' | 'swipe' | 'hold'; x: number; y: number; extra?: string }>;
} {
  const logs: TerminalLog[] = [];
  const engineUpper = step.language.toUpperCase();
  const effectiveDelay = calculateEffectiveDelay(speedSettings.triggerDelayMs, speedSettings.randomDelayMode);
  let stepElapsedMs = effectiveDelay;

  logs.push({
    id: `dbg-start-${step.id}-${Date.now()}`,
    timestampOffset: Math.round((baseOffsetMs + stepElapsedMs) * 10) / 10,
    level: 'INFO',
    message: `[DEBUGGER] Stepping into Block #${step.stepNumber} [${engineUpper}]...`,
    engine: engineUpper
  });

  const gestures = extractGestures(step.code);
  gestures.forEach((gesture, gIdx) => {
    stepElapsedMs += speedSettings.executionSpeedMs; // Milliseconds delay between actions
    logs.push({
      id: `dbg-gesture-${step.id}-${gIdx}`,
      timestampOffset: Math.round((baseOffsetMs + stepElapsedMs) * 10) / 10,
      level: 'GESTURE',
      message: `${engineUpper} ${gesture.type.toUpperCase()} executed at (${gesture.x}, ${gesture.y})`,
      engine: engineUpper
    });
  });

  const { updatedState, mutations } = extractSharedStateMutations(step.code, currentState);
  mutations.forEach((mut, mIdx) => {
    logs.push({
      id: `dbg-state-${step.id}-${mIdx}`,
      timestampOffset: Math.round((baseOffsetMs + stepElapsedMs) * 10) / 10,
      level: 'SHARED_STATE',
      message: `sharedState["${mut.key}"] := ${JSON.stringify(mut.value)}`,
      engine: engineUpper
    });
  });

  stepElapsedMs += speedSettings.executionSpeedMs;
  logs.push({
    id: `dbg-done-${step.id}`,
    timestampOffset: Math.round((baseOffsetMs + stepElapsedMs) * 10) / 10,
    level: 'SUCCESS',
    message: `Block #${step.stepNumber} [${engineUpper}] finished in ${stepElapsedMs}ms`,
    engine: engineUpper
  });

  return {
    updatedState,
    logs,
    elapsedMs: stepElapsedMs,
    gestures
  };
}

/**
 * Simulates pipeline execution and returns logs and final sharedState
 */
export function executePipelineSimulator(
  steps: PipelineStep[],
  speedSettings: SpeedSettings,
  initialState: SharedStateData = {}
): { logs: TerminalLog[]; finalState: SharedStateData; totalElapsedMs: number } {
  const logs: TerminalLog[] = [];
  let currentState: SharedStateData = { ...initialState };
  let currentOffsetMs = 0;

  logs.push({
    id: `log-start-${Date.now()}`,
    timestampOffset: 0,
    level: 'INFO',
    message: `[BRIDGE] Initializing Multi-Language Pipeline (${steps.filter(s => s.enabled).length} active blocks)...`,
    engine: 'NDK_BRIDGE'
  });

  const activeSteps = steps.filter(s => s.enabled);

  for (let index = 0; index < activeSteps.length; index++) {
    const step = activeSteps[index];
    const engineUpper = step.language.toUpperCase();
    const effectiveDelay = calculateEffectiveDelay(speedSettings.triggerDelayMs, speedSettings.randomDelayMode);

    currentOffsetMs += effectiveDelay;

    logs.push({
      id: `log-step-start-${step.id}-${index}`,
      timestampOffset: Math.round(currentOffsetMs * 10) / 10,
      level: 'INFO',
      message: `Step ${step.stepNumber}: Starting execution [Engine: ${engineUpper}] via native AutomationBridge...`,
      engine: engineUpper
    });

    // Detect gestures in this step
    const gestures = extractGestures(step.code);
    gestures.forEach((gesture, gIdx) => {
      currentOffsetMs += speedSettings.executionSpeedMs; // Overall speed of delay between macros in ms
      logs.push({
        id: `log-gesture-${step.id}-${gIdx}`,
        timestampOffset: Math.round(currentOffsetMs * 10) / 10,
        level: 'GESTURE',
        message: `${engineUpper} ${gesture.type === 'tap' ? 'Tap' : 'Gesture'} injected at (${gesture.x}, ${gesture.y}) [${gesture.extra || 'fast'}]`,
        engine: engineUpper
      });
    });

    // Detect sharedState changes
    const { updatedState, mutations } = extractSharedStateMutations(step.code, currentState);
    currentState = updatedState;

    mutations.forEach((mut, mIdx) => {
      logs.push({
        id: `log-state-${step.id}-${mIdx}`,
        timestampOffset: Math.round(currentOffsetMs * 10) / 10,
        level: 'SHARED_STATE',
        message: `sharedState["${mut.key}"] <= ${JSON.stringify(mut.value)}`,
        engine: engineUpper
      });
    });

    currentOffsetMs += speedSettings.executionSpeedMs;

    // Step completion
    logs.push({
      id: `log-step-done-${step.id}`,
      timestampOffset: Math.round(currentOffsetMs * 10) / 10,
      level: 'SUCCESS',
      message: `Step ${step.stepNumber} (${engineUpper}) completed successfully.`,
      engine: engineUpper
    });
  }

  currentOffsetMs += 10;
  logs.push({
    id: `log-done-${Date.now()}`,
    timestampOffset: Math.round(currentOffsetMs * 10) / 10,
    level: 'SUCCESS',
    message: `[PIPELINE_COMPLETE] All ${activeSteps.length} blocks executed. sharedState preserved across boundaries.`,
    engine: 'AUTOMATION_CORE'
  });

  return {
    logs,
    finalState: currentState,
    totalElapsedMs: Math.round(currentOffsetMs * 10) / 10
  };
}
