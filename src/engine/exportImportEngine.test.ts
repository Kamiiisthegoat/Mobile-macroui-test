import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMacroExportPackage,
  createPipelineExportPackage,
  createSuiteExportPackage,
  formatCodeAsLanguage,
  detectLanguageFromFilename,
  detectLanguageFromContent,
  parseUniversalImport,
  LANGUAGE_FILE_DEFINITIONS
} from './exportImportEngine.js';
import { MacroConfig, PipelineStep, ExportFormat } from '../types/macro.js';

test('LANGUAGE_FILE_DEFINITIONS covers all required coding languages', () => {
  const formats = ['json', 'cpp', 'luau', 'quickjs', 'js', 'kt'] as const;
  for (const f of formats) {
    assert.ok(LANGUAGE_FILE_DEFINITIONS[f]);
    assert.ok(LANGUAGE_FILE_DEFINITIONS[f].extension);
  }
  assert.equal(LANGUAGE_FILE_DEFINITIONS.cpp.extension, '.cpp');
  assert.equal(LANGUAGE_FILE_DEFINITIONS.luau.extension, '.luau');
  assert.equal(LANGUAGE_FILE_DEFINITIONS.quickjs.extension, '.qjs');
  assert.equal(LANGUAGE_FILE_DEFINITIONS.js.extension, '.js');
  assert.equal(LANGUAGE_FILE_DEFINITIONS.kt.extension, '.kt');
  assert.equal(LANGUAGE_FILE_DEFINITIONS.json.extension, '.json');
});

test('formatCodeAsLanguage generates native C++ source with evdev headers', () => {
  const code = 'nativeTap(540, 1120, 25);';
  const formatted = formatCodeAsLanguage('Soru NDK', code, 'cpp', { delayMs: 5 });
  assert.ok(formatted.includes('#include <jni.h>'));
  assert.ok(formatted.includes('nativeTap(float x, float y, int holdMs)'));
  assert.ok(formatted.includes('Java_com_custom_macroexecutor_AutomationBridge_executeRoutine'));
  assert.ok(formatted.includes('nativeTap(540, 1120, 25);'));
});

test('formatCodeAsLanguage generates native Luau script with bridge definitions', () => {
  const code = 'tap(200, 450)\nwait(100)';
  const formatted = formatCodeAsLanguage('Portal Combo', code, 'luau', { delayMs: 10 });
  assert.ok(formatted.includes('--!strict'));
  assert.ok(formatted.includes('local bridge = {'));
  assert.ok(formatted.includes('task.wait(ms / 1000)'));
  assert.ok(formatted.includes('tap(200, 450)'));
});

test('formatCodeAsLanguage generates Kotlin routine with AutomationBridge bindings', () => {
  const code = 'tap(185f, 450f)\nwait(50)';
  const formatted = formatCodeAsLanguage('KenHaki', code, 'kt', { delayMs: 5 });
  assert.ok(formatted.includes('package com.custom.macroexecutor.routines'));
  assert.ok(formatted.includes('object KenHaki'));
  assert.ok(formatted.includes('AutomationBridge'));
});

test('detectLanguageFromFilename accurately resolves all coding language extensions', () => {
  assert.equal(detectLanguageFromFilename('routine.cpp'), 'cpp');
  assert.equal(detectLanguageFromFilename('macro.h'), 'cpp');
  assert.equal(detectLanguageFromFilename('blox.luau'), 'luau');
  assert.equal(detectLanguageFromFilename('roblox.lua'), 'luau');
  assert.equal(detectLanguageFromFilename('engine.qjs'), 'quickjs');
  assert.equal(detectLanguageFromFilename('script.js'), 'js');
  assert.equal(detectLanguageFromFilename('Bridge.kt'), 'kt');
  assert.equal(detectLanguageFromFilename('build.kts'), 'kt');
  assert.equal(detectLanguageFromFilename('profile.json'), 'json');
});

test('detectLanguageFromContent detects language via syntax markers', () => {
  assert.equal(detectLanguageFromContent('#include <jni.h>\nvoid test() {}'), 'cpp');
  assert.equal(detectLanguageFromContent('--!strict\nlocal x = 5\ntask.wait(1)'), 'luau');
  assert.equal(detectLanguageFromContent('package com.custom\nfun main() {}'), 'kt');
  assert.equal(detectLanguageFromContent('{"version": "1.0", "type": "pipeline"}'), 'json');
});

test('parseUniversalImport imports raw C++ source file as custom routine', () => {
  const cppSource = `#include <jni.h>\nnativeTap(540.0f, 1120.0f, 25);`;
  const result = parseUniversalImport(cppSource, 'flash_step.cpp');
  assert.equal(result.isValid, true);
  assert.equal(result.format, 'cpp');
  assert.equal(result.detectedLanguage, 'cpp');
  assert.equal(result.packageType, 'raw_script');
  assert.ok(result.code.includes('nativeTap'));
});

test('parseUniversalImport imports raw Luau script as custom routine', () => {
  const luauSource = `--!strict\nlocal targetX = 540\nwait(120)\ntap(targetX, 450)`;
  const result = parseUniversalImport(luauSource, 'soru_roblox.luau');
  assert.equal(result.isValid, true);
  assert.equal(result.format, 'luau');
  assert.equal(result.detectedLanguage, 'luau');
  assert.equal(result.packageType, 'raw_script');
});

test('parseUniversalImport imports raw Kotlin file as custom routine', () => {
  const ktSource = `package com.custom.macroexecutor\nAutomationBridge.injectTap(200f, 450f)`;
  const result = parseUniversalImport(ktSource, 'Automation.kt');
  assert.equal(result.isValid, true);
  assert.equal(result.format, 'kt');
  assert.equal(result.detectedLanguage, 'kt');
});

test('parseUniversalImport imports JSON pipeline package', () => {
  const pipelineJson = JSON.stringify({
    version: '1.0',
    type: 'pipeline',
    name: 'Multi Combo',
    steps: [
      { id: '1', stepNumber: 1, language: 'cpp', code: 'nativeTap(100, 200);', enabled: true },
      { id: '2', stepNumber: 2, language: 'luau', code: 'tap(200, 300)', enabled: true }
    ]
  });

  const result = parseUniversalImport(pipelineJson, 'combo.json');
  assert.equal(result.isValid, true);
  assert.equal(result.format, 'json');
  assert.equal(result.packageType, 'pipeline');
  assert.equal(result.itemCount, 2);
});
