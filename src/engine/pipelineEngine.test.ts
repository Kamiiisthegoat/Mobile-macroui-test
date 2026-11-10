import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEffectiveDelay,
  generateSnippet,
  extractSharedStateMutations,
  extractGestures,
  executePipelineSimulator,
  executeStepDebugger
} from './pipelineEngine';
import { PipelineStep, SpeedSettings } from '../types/macro';

test('calculateEffectiveDelay returns base delay when jitter is disabled', () => {
  const delay = calculateEffectiveDelay(50, false);
  assert.equal(delay, 50);
});

test('calculateEffectiveDelay adds jitter within ±20% range when jitter is enabled', () => {
  for (let i = 0; i < 20; i++) {
    const delay = calculateEffectiveDelay(100, true);
    assert.ok(delay >= 75 && delay <= 125, `Delay ${delay} should be within [80, 120] ± rounding`);
  }
});

test('generateSnippet produces language-specific syntax with snapshot support', () => {
  const cppSnippet = generateSnippet('tap', 'cpp', { x: 500, y: 1000 });
  assert.ok(cppSnippet.includes('nativeTap(500.0f, 1000.0f, 25);'));
  assert.ok(cppSnippet.includes('sharedState["lastTapX"] = 500;'));

  const luauSnapshot = generateSnippet('snapshot', 'luau');
  assert.ok(luauSnapshot.includes('takeScreenshot'));

  const qjsSnapshot = generateSnippet('snapshot', 'quickjs');
  assert.ok(qjsSnapshot.includes('captureScreen'));
});

test('extractSharedStateMutations extracts bracket and dot notation', () => {
  const code = `
    sharedState["targetX"] = 540;
    sharedState["isComboActive"] = true;
    sharedState.lastSkill = "Soru";
    sharedState.threshold = 95.5;
  `;
  const result = extractSharedStateMutations(code, {});
  assert.equal(result.updatedState['targetX'], 540);
  assert.equal(result.updatedState['isComboActive'], true);
  assert.equal(result.updatedState['lastSkill'], 'Soru');
  assert.equal(result.updatedState['threshold'], 95.5);
  assert.equal(result.mutations.length, 4);
});

test('extractGestures identifies taps and swipes', () => {
  const code = `
    nativeTap(540.0f, 1120.0f, 25);
    swipe(200, 400, 200, 800, 150);
  `;
  const gestures = extractGestures(code);
  assert.equal(gestures.length, 2);
  assert.equal(gestures[0].type, 'tap');
  assert.equal(gestures[0].x, 540);
  assert.equal(gestures[0].y, 1120);
});

test('executeStepDebugger steps through a single block and updates sharedState', () => {
  const step: PipelineStep = {
    id: 'step-1',
    stepNumber: 1,
    language: 'cpp',
    code: 'nativeTap(540.0f, 1120.0f, 25);\nsharedState["portalActive"] = true;',
    targetDesc: 'target: cpp',
    enabled: true
  };

  const speedSettings: SpeedSettings = {
    triggerDelayMs: 5,
    randomDelayMode: false,
    executionSpeedMs: 10,
    smartLoop: true
  };

  const result = executeStepDebugger(step, {}, speedSettings, 0, 0);
  assert.equal(result.updatedState['portalActive'], true);
  assert.ok(result.logs.some(l => l.level === 'GESTURE'));
  assert.ok(result.logs.some(l => l.level === 'SHARED_STATE'));
});

test('executePipelineSimulator runs sequential multi-language steps with ms delay', () => {
  const steps: PipelineStep[] = [
    {
      id: 'step-1',
      stepNumber: 1,
      language: 'cpp',
      code: 'nativeTap(540.0f, 1120.0f, 25);\nsharedState["lastTapX"] = 540;',
      targetDesc: 'target: cpp',
      enabled: true
    },
    {
      id: 'step-2',
      stepNumber: 2,
      language: 'luau',
      code: 'local targetX = sharedState.lastTapX or 540\nwait(120)\ntap(targetX, 450)\nsharedState.comboFinished = true',
      targetDesc: 'target: luau',
      enabled: true
    }
  ];

  const speedSettings: SpeedSettings = {
    triggerDelayMs: 5,
    randomDelayMode: false,
    executionSpeedMs: 10,
    smartLoop: true
  };

  const execution = executePipelineSimulator(steps, speedSettings, {});
  assert.ok(execution.logs.length > 5);
  assert.equal(execution.finalState['lastTapX'], 540);
  assert.equal(execution.finalState['comboFinished'], true);
});
