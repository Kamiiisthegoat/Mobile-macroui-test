import React, { useState } from 'react';
import { Header } from './components/Header';
import { FooterBar } from './components/FooterBar';
import { MacroEngineCard } from './components/MacroEngineCard';
import { SpeedControls } from './components/SpeedControls';
import { PipelineBuilder } from './components/PipelineBuilder';
import { SingleEngineEditor } from './components/SingleEngineEditor';
import { PreMadeConfigs } from './components/PreMadeConfigs';
import { GestureRecorderModal } from './components/GestureRecorderModal';
import { CoordinatePickerModal } from './components/CoordinatePickerModal';
import { PixelColorCheckerModal } from './components/PixelColorCheckerModal';
import { FloatingHudOverlay } from './components/FloatingHudOverlay';
import { OutputTerminal } from './components/OutputTerminal';
import { AndroidArchitectureModal } from './components/AndroidArchitectureModal';
import { AccessibilityModal } from './components/AccessibilityModal';
import { PerformanceMetricsView } from './components/PerformanceMetricsView';
import { ExportImportModal } from './components/ExportImportModal';
import { MacroControlPanel } from './components/MacroControlPanel';

import {
  MacroConfig,
  PipelineStep,
  ScriptLanguage,
  SharedStateData,
  SpeedSettings,
  TerminalLog,
  ScreenCalibration,
  ExportFormat,
  ExportedSuiteFile
} from './types/macro';

import {
  DEFAULT_MACRO_CONFIGS,
  INITIAL_PIPELINE_STEPS,
  SINGLE_ENGINE_TEMPLATES
} from './data/defaultConfigs';

import { executePipelineSimulator } from './engine/pipelineEngine';

export default function App() {
  // Navigation & View States (home, templates, recorder, metrics)
  const [activeTab, setActiveTab] = useState<'home' | 'templates' | 'recorder' | 'metrics'>('home');
  const [engineActive, setEngineActive] = useState<boolean>(false);
  const [multiLanguage, setMultiLanguage] = useState<boolean>(false);
  const [selectedSingleEngine, setSelectedSingleEngine] = useState<ScriptLanguage>('quickjs');
  const [singleEngineCode, setSingleEngineCode] = useState<string>(SINGLE_ENGINE_TEMPLATES['quickjs']);

  // Modals & Overlays
  const [isCoordsPickerOpen, setIsCoordsPickerOpen] = useState(false);
  const [isColorCheckerOpen, setIsColorCheckerOpen] = useState(false);
  const [isHudOpen, setIsHudOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isAccessibilityOpen, setIsAccessibilityOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);
  const [exportImportTab, setExportImportTab] = useState<'export' | 'import' | 'presets'>('export');
  const [exportImportInitialLang, setExportImportInitialLang] = useState<ExportFormat>('json');
  const [selectedExportMacro, setSelectedExportMacro] = useState<MacroConfig | null>(null);

  const [targetBinding, setTargetBinding] = useState<{ configId: string; targetType: 'soru' | 'portal' } | null>(null);

  // Screen DPI & Resolution Calibration state (enforced before coordinates picking)
  const [screenCalibration, setScreenCalibration] = useState<ScreenCalibration>({
    width: 1080,
    height: 2400,
    dpi: 440,
    deviceName: 'Xiaomi / Poco F5 / X6',
    isCalibrated: false
  });

  // Macro Configurations & Pipeline Steps
  const [configs, setConfigs] = useState<MacroConfig[]>(DEFAULT_MACRO_CONFIGS);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(INITIAL_PIPELINE_STEPS);
  const [sharedState, setSharedState] = useState<SharedStateData>({
    lastTapX: 540,
    soruReady: true,
    lastHoldDuration: 800
  });

  // Timing & Speed Settings (Delay between macros in ms)
  const [speedSettings, setSpeedSettings] = useState<SpeedSettings>({
    triggerDelayMs: 5,
    randomDelayMode: false,
    executionSpeedMs: 10,
    smartLoop: true
  });

  // Active Menu Size Scaling (50% - 150%)
  const [menuSize, setMenuSize] = useState(100);
  const [showToastOnTrigger, setShowToastOnTrigger] = useState(false);

  // Terminal Logs
  const [logs, setLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      timestampOffset: 0.0,
      level: 'INFO',
      message: 'MacroExecutor Native Bridge Connected · JNI NDK Ready (API 26+)',
      engine: 'CORE'
    },
    {
      id: 'init-2',
      timestampOffset: 12.4,
      level: 'INFO',
      message: 'Native AccessibilityService bound successfully. GestureDescription ready.',
      engine: 'ACCESSIBILITY'
    },
    {
      id: 'init-3',
      timestampOffset: 22.5,
      level: 'SUCCESS',
      message: 'Loaded JNI libraries: libmacro_ndk_engine.so, libluau_runtime.so, libquickjs.so',
      engine: 'JNI_LOADER'
    }
  ]);
  const [totalElapsedMs, setTotalElapsedMs] = useState<number>(22.5);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Add Log Helper
  const handleAddLog = (level: 'INFO' | 'SUCCESS' | 'GESTURE' | 'SHARED_STATE' | 'WARN' | 'ERROR', message: string, engine?: string) => {
    const newLog: TerminalLog = {
      id: `log-${Date.now()}-${Math.random()}`,
      timestampOffset: Math.round((totalElapsedMs + Math.random() * 15) * 10) / 10,
      level,
      message,
      engine
    };
    setLogs((prev) => [...prev, newLog]);
    setTotalElapsedMs((prev) => Math.round((prev + 12.5) * 10) / 10);
  };

  const handleClearLogs = () => {
    setLogs([]);
    setTotalElapsedMs(0);
  };

  // Toggle Macro Engine
  const handleToggleEngine = () => {
    const nextState = !engineActive;
    setEngineActive(nextState);
    handleAddLog(
      nextState ? 'SUCCESS' : 'INFO',
      `Macro Engine switched to [${nextState ? 'ON' : 'OFF'}]. ${nextState ? 'Kernel touch listeners active.' : 'Standby mode.'}`,
      'ENGINE'
    );
  };

  // Execute Pipeline
  const handleExecutePipeline = () => {
    setIsExecuting(true);
    setEngineActive(true);
    handleAddLog('INFO', `Starting execution of ${pipelineSteps.length}-block pipeline at ${speedSettings.executionSpeedMs}ms inter-macro speed...`, 'PIPELINE');

    setTimeout(() => {
      const execution = executePipelineSimulator(pipelineSteps, speedSettings, sharedState);
      setLogs((prev) => [...prev, ...execution.logs]);
      setSharedState(execution.finalState);
      setTotalElapsedMs((prev) => prev + execution.totalElapsedMs);
      setIsExecuting(false);
    }, 400);
  };

  // Execute Single Engine Script
  const handleExecuteSingleEngine = () => {
    setIsExecuting(true);
    setEngineActive(true);
    handleAddLog('INFO', `Starting single engine execution [Target: ${selectedSingleEngine.toUpperCase()}] with ${speedSettings.executionSpeedMs}ms delay...`, selectedSingleEngine.toUpperCase());

    setTimeout(() => {
      handleAddLog('GESTURE', `Native tap injected at (200, 450) [25ms]`, selectedSingleEngine.toUpperCase());
      handleAddLog('SUCCESS', `${selectedSingleEngine.toUpperCase()} routine completed without error.`, selectedSingleEngine.toUpperCase());
      setIsExecuting(false);
    }, 300);
  };

  // Execute Pre-made Config
  const handleExecuteConfig = (config: MacroConfig) => {
    setEngineActive(true);
    handleAddLog('INFO', `Executing pre-made config: ${config.name}...`, 'PRE_MADE');
    setTimeout(() => {
      handleAddLog('GESTURE', `Soru tap dispatched to (${config.soruCoords.x}, ${config.soruCoords.y}) [Verified Color: ${config.soruColor}]`, 'SORU_NDK');
      handleAddLog('GESTURE', `Portal secondary tap dispatched to (${config.portalCoords.x}, ${config.portalCoords.y}) [Color: ${config.portalColor}]`, 'PORTAL_NDK');
      handleAddLog('SUCCESS', `${config.name} flash-step combo finished in 45ms.`, 'NDK');
    }, 250);
  };

  // Load Config into Single Engine Editor
  const handleLoadConfigIntoEditor = (config: MacroConfig) => {
    setSingleEngineCode(config.code);
    setSelectedSingleEngine('quickjs');
    setMultiLanguage(false);
    setActiveTab('home');
    handleAddLog('INFO', `Loaded '${config.name}' into QuickJS editor.`, 'ROUTINE');
  };

  // Duplicate / Clone Macro (QoL)
  const handleDuplicateConfig = (config: MacroConfig) => {
    const cloned: MacroConfig = {
      ...config,
      id: `config-${Date.now()}`,
      name: `${config.name} (Copy)`
    };
    setConfigs((prev) => [cloned, ...prev]);
    handleAddLog('SUCCESS', `Duplicated macro: Created '${cloned.name}'.`, 'MACRO_MANAGER');
  };

  // Open Export / Import Modal
  const handleOpenExportImport = (
    tab: 'export' | 'import' | 'presets' = 'export',
    initialLang: ExportFormat = 'json',
    macro?: MacroConfig
  ) => {
    setExportImportTab(tab);
    setExportImportInitialLang(initialLang);
    setSelectedExportMacro(macro || null);
    setIsExportImportOpen(true);
  };

  // Import Callbacks
  const handleImportPipeline = (
    steps: PipelineStep[],
    newSpeed?: SpeedSettings,
    newState?: SharedStateData
  ) => {
    setPipelineSteps(steps);
    if (newSpeed) setSpeedSettings(newSpeed);
    if (newState) setSharedState(newState);
    setMultiLanguage(true);
    setActiveTab('home');
    handleAddLog('SUCCESS', `Imported ${steps.length}-block pipeline into workspace.`, 'IMPORTER');
  };

  const handleImportMacro = (macro: MacroConfig) => {
    setConfigs((prev) => [macro, ...prev]);
    setActiveTab('templates');
    handleAddLog('SUCCESS', `Added '${macro.name}' to pre-made templates.`, 'IMPORTER');
  };

  const handleImportSuite = (suite: ExportedSuiteFile) => {
    if (suite.configs) setConfigs(suite.configs);
    if (suite.pipelineSteps) setPipelineSteps(suite.pipelineSteps);
    if (suite.speedSettings) setSpeedSettings(suite.speedSettings);
    if (suite.sharedState) setSharedState(suite.sharedState);
    if (suite.singleEngineCode) setSingleEngineCode(suite.singleEngineCode);
    if (suite.selectedSingleEngine) setSelectedSingleEngine(suite.selectedSingleEngine);
    setActiveTab('home');
    handleAddLog('SUCCESS', `Restored full MacroExecutor suite profile (${suite.name || 'Custom'}).`, 'IMPORTER');
  };

  const handleImportSingleCode = (code: string, lang: ScriptLanguage) => {
    setSingleEngineCode(code);
    setSelectedSingleEngine(lang);
    setMultiLanguage(false);
    setActiveTab('home');
    handleAddLog('SUCCESS', `Loaded ${lang.toUpperCase()} routine into single engine editor.`, 'IMPORTER');
  };

  const handleAddPipelineStep = (step: PipelineStep) => {
    setPipelineSteps((prev) => [...prev, step]);
    setMultiLanguage(true);
    setActiveTab('home');
    handleAddLog('SUCCESS', `Added new block #${pipelineSteps.length + 1} (${step.language.toUpperCase()}) to pipeline.`, 'PIPELINE');
  };

  // Separate Tool Triggers: Coordinates vs Pixel Color
  const handleOpenCoordsPickerForTarget = (configId: string, targetType: 'soru' | 'portal') => {
    setTargetBinding({ configId, targetType });
    setIsCoordsPickerOpen(true);
  };

  const handleOpenColorCheckerForTarget = (configId: string, targetType: 'soru' | 'portal') => {
    setTargetBinding({ configId, targetType });
    setIsColorCheckerOpen(true);
  };

  // Apply Picked Coordinates (Auto-Scaled & Calibrated)
  const handleApplyCoordinates = (coords: { x: number; y: number }) => {
    if (targetBinding) {
      setConfigs((prev) =>
        prev.map((c) => {
          if (c.id === targetBinding.configId) {
            if (targetBinding.targetType === 'soru') {
              return { ...c, soruCoords: coords };
            } else {
              return { ...c, portalCoords: coords };
            }
          }
          return c;
        })
      );
      handleAddLog('SUCCESS', `Bound ${targetBinding.targetType.toUpperCase()} coordinates (${coords.x}, ${coords.y}) to config.`, 'COORDS');
      setTargetBinding(null);
    } else {
      const tapCommand = `tap(${coords.x}, ${coords.y});`;
      setSingleEngineCode((prev) => (prev ? `${prev}\n${tapCommand}` : tapCommand));
      handleAddLog('SUCCESS', `Sampled coordinates (${coords.x}, ${coords.y}). Appended tap() to active script.`, 'COORDS');
    }
  };

  // Apply Picked Pixel Color
  const handleApplyColor = (hexColor: string, coords: { x: number; y: number }) => {
    if (targetBinding) {
      setConfigs((prev) =>
        prev.map((c) => {
          if (c.id === targetBinding.configId) {
            if (targetBinding.targetType === 'soru') {
              return { ...c, soruColor: hexColor };
            } else {
              return { ...c, portalColor: hexColor };
            }
          }
          return c;
        })
      );
      handleAddLog('SUCCESS', `Bound ${targetBinding.targetType.toUpperCase()} color verification (${hexColor}) at (${coords.x}, ${coords.y}).`, 'COLOR');
      setTargetBinding(null);
    } else {
      const colorCheck = `if (getPixel(${coords.x}, ${coords.y}) === "${hexColor}") {\n    tap(${coords.x}, ${coords.y});\n}`;
      setSingleEngineCode((prev) => (prev ? `${prev}\n${colorCheck}` : colorCheck));
      handleAddLog('SUCCESS', `Sampled color ${hexColor} at (${coords.x}, ${coords.y}). Appended color condition.`, 'COLOR');
    }
  };

  const handleUpdateConfig = (updated: MacroConfig) => {
    setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  // Insert Gesture Recorder Code
  const handleInsertRecorderCode = (code: string, lang: ScriptLanguage) => {
    const newStep: PipelineStep = {
      id: `step-${Date.now()}`,
      stepNumber: pipelineSteps.length + 1,
      language: lang,
      targetDesc: `target: ${lang}`,
      enabled: true,
      code
    };
    setPipelineSteps((prev) => [...prev, newStep]);
    setMultiLanguage(true);
    setActiveTab('home');
    handleAddLog('SUCCESS', `Synthesized ${lang.toUpperCase()} recorded gesture & photo sequence added to pipeline.`, 'RECORDER');
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e0e2ec] font-sans pb-16">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenCoordsPicker={() => {
          setTargetBinding(null);
          setIsCoordsPickerOpen(true);
        }}
        onOpenColorChecker={() => {
          setTargetBinding(null);
          setIsColorCheckerOpen(true);
        }}
        onToggleFloatingHud={() => setIsHudOpen((prev) => !prev)}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
        onOpenAccessibility={() => setIsAccessibilityOpen(true)}
        onOpenExportImport={(tab) => handleOpenExportImport(tab || 'export', 'json')}
        isHudOpen={isHudOpen}
        engineActive={engineActive}
      />

      {/* Main Content Area */}
      <main className="max-w-xl mx-auto px-4 py-4 space-y-5">
        {activeTab === 'home' && (
          <>
            {/* Macro Engine Status & Multi-Language Toggle */}
            <MacroEngineCard
              engineActive={engineActive}
              onToggleEngine={handleToggleEngine}
              multiLanguage={multiLanguage}
              onToggleMultiLanguage={setMultiLanguage}
            />

            {/* Native MacroBridge Control Panel (Accessibility / Overlay / Screen Capture / QuickJS) */}
            <MacroControlPanel />

            {/* Timing & Speed Settings (Delay between macros in ms) */}
            <SpeedControls
              settings={speedSettings}
              onChange={setSpeedSettings}
            />

            {/* Language Engine Body: Pipeline vs Single Engine */}
            {multiLanguage ? (
              <PipelineBuilder
                steps={pipelineSteps}
                onUpdateSteps={setPipelineSteps}
                onExecute={handleExecutePipeline}
                onOpenPicker={() => {
                  setTargetBinding(null);
                  setIsCoordsPickerOpen(true);
                }}
                isExecuting={isExecuting}
                sharedState={sharedState}
                onUpdateSharedState={setSharedState}
                speedSettings={speedSettings}
                onLog={handleAddLog}
                onOpenExport={() => handleOpenExportImport('export', 'json')}
                onOpenImport={() => handleOpenExportImport('import', 'json')}
              />
            ) : (
              <SingleEngineEditor
                selectedLanguage={selectedSingleEngine}
                onSelectLanguage={setSelectedSingleEngine}
                code={singleEngineCode}
                onChangeCode={setSingleEngineCode}
                onExecute={handleExecuteSingleEngine}
                onOpenCoordsPicker={() => {
                  setTargetBinding(null);
                  setIsCoordsPickerOpen(true);
                }}
                onOpenColorChecker={() => {
                  setTargetBinding(null);
                  setIsColorCheckerOpen(true);
                }}
                onOpenCanvasSimulator={() => {
                  setTargetBinding(null);
                  setIsCoordsPickerOpen(true);
                }}
                onToggleFloatingHud={() => setIsHudOpen((prev) => !prev)}
                isExecuting={isExecuting}
                showToastOnTrigger={showToastOnTrigger}
                onToggleToast={setShowToastOnTrigger}
                menuSize={menuSize}
                onChangeMenuSize={setMenuSize}
                onOpenExport={() => handleOpenExportImport('export', selectedSingleEngine)}
                onOpenImport={() => handleOpenExportImport('import', selectedSingleEngine)}
              />
            )}

            {/* Terminal Output */}
            <OutputTerminal
              logs={logs}
              onClearLogs={handleClearLogs}
              totalElapsedMs={totalElapsedMs}
            />
          </>
        )}

        {activeTab === 'templates' && (
          <>
            <PreMadeConfigs
              configs={configs}
              onUpdateConfig={handleUpdateConfig}
              onLoadIntoEditor={handleLoadConfigIntoEditor}
              onExecuteConfig={handleExecuteConfig}
              onOpenCoordsPickerForTarget={handleOpenCoordsPickerForTarget}
              onOpenColorCheckerForTarget={handleOpenColorCheckerForTarget}
              onOpenExportForMacro={(m) => handleOpenExportImport('export', 'json', m)}
              onOpenImport={() => handleOpenExportImport('import', 'json')}
              onDuplicateConfig={handleDuplicateConfig}
            />

            <OutputTerminal
              logs={logs}
              onClearLogs={handleClearLogs}
              totalElapsedMs={totalElapsedMs}
            />
          </>
        )}

        {activeTab === 'recorder' && (
          <>
            <GestureRecorderModal
              onInsertIntoPipeline={handleInsertRecorderCode}
              onInsertIntoSingleEngine={(code) => {
                setSingleEngineCode(code);
                setActiveTab('home');
                handleAddLog('SUCCESS', 'Synthesized gestures applied to active script.', 'RECORDER');
              }}
              onLog={handleAddLog}
            />

            <OutputTerminal
              logs={logs}
              onClearLogs={handleClearLogs}
              totalElapsedMs={totalElapsedMs}
            />
          </>
        )}

        {activeTab === 'metrics' && (
          <>
            <PerformanceMetricsView
              onLog={handleAddLog}
              speedMs={speedSettings.executionSpeedMs}
            />

            <OutputTerminal
              logs={logs}
              onClearLogs={handleClearLogs}
              totalElapsedMs={totalElapsedMs}
            />
          </>
        )}
      </main>

      {/* Floating Window HUD Overlay (SYSTEM_ALERT_WINDOW) */}
      <FloatingHudOverlay
        isOpen={isHudOpen}
        onClose={() => setIsHudOpen(false)}
        engineActive={engineActive}
        onToggleEngine={handleToggleEngine}
        onOpenCoordsPicker={() => {
          setTargetBinding(null);
          setIsCoordsPickerOpen(true);
        }}
        onOpenColorChecker={() => {
          setTargetBinding(null);
          setIsColorCheckerOpen(true);
        }}
        onOpenRecorder={() => setActiveTab('recorder')}
        executionSpeedMs={speedSettings.executionSpeedMs}
        menuSize={menuSize}
      />

      {/* Tool 1: Dedicated Coordinate Picker Modal (Screen DPI & Resolution Calibration Gate Enforced) */}
      <CoordinatePickerModal
        isOpen={isCoordsPickerOpen}
        onClose={() => setIsCoordsPickerOpen(false)}
        onSelectCoords={handleApplyCoordinates}
        targetBinding={targetBinding}
        calibration={screenCalibration}
        onSaveCalibration={setScreenCalibration}
      />

      {/* Tool 2: Dedicated Pixel Color Checker Modal (Above-Thumb Floating Magnifier Loupe) */}
      <PixelColorCheckerModal
        isOpen={isColorCheckerOpen}
        onClose={() => setIsColorCheckerOpen(false)}
        onSelectColor={handleApplyColor}
        targetBinding={targetBinding}
      />

      {/* Multi-Language Exporter & Importer (C++, Luau, QuickJS, JS, Kotlin, JSON) */}
      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        pipelineSteps={pipelineSteps}
        configs={configs}
        speedSettings={speedSettings}
        sharedState={sharedState}
        singleEngineCode={singleEngineCode}
        selectedSingleEngine={selectedSingleEngine}
        preSelectedMacro={selectedExportMacro}
        initialTab={exportImportTab}
        initialLanguage={exportImportInitialLang}
        onImportPipeline={handleImportPipeline}
        onImportMacro={handleImportMacro}
        onImportSuite={handleImportSuite}
        onImportSingleCode={handleImportSingleCode}
        onAddPipelineStep={handleAddPipelineStep}
        onLog={handleAddLog}
      />

      {/* Android Architecture & Code Exporter Modal */}
      <AndroidArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Accessibility Service & Permissions Modal */}
      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
      />

      {/* Persistent Footer Status Bar */}
      <FooterBar
        engineActive={engineActive}
        multiLanguage={multiLanguage}
        blockCount={pipelineSteps.length}
        singleEngineName={selectedSingleEngine === 'quickjs' ? 'QuickJS' : selectedSingleEngine.toUpperCase()}
        executionSpeedMs={speedSettings.executionSpeedMs}
      />
    </div>
  );
}
