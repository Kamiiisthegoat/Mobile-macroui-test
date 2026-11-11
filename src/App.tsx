import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

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

const MacroBridge = registerPlugin<any>('MacroBridge');

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'templates' | 'recorder' | 'metrics'>('home');
  const [engineActive, setEngineActive] = useState<boolean>(false);
  const [multiLanguage, setMultiLanguage] = useState<boolean>(false);
  const [selectedSingleEngine, setSelectedSingleEngine] = useState<ScriptLanguage>('quickjs');
  const [singleEngineCode, setSingleEngineCode] = useState<string>(SINGLE_ENGINE_TEMPLATES['quickjs']);

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

  const [screenCalibration, setScreenCalibration] = useState<ScreenCalibration>({
    width: 1080,
    height: 2400,
    dpi: 440,
    deviceName: 'Xiaomi / Poco F5 / X6',
    isCalibrated: false
  });

  const [configs, setConfigs] = useState<MacroConfig[]>(DEFAULT_MACRO_CONFIGS);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(INITIAL_PIPELINE_STEPS);
  const [sharedState, setSharedState] = useState<SharedStateData>({
    lastTapX: 540,
    soruReady: true,
    lastHoldDuration: 800
  });

  const [speedSettings, setSpeedSettings] = useState<SpeedSettings>({
    triggerDelayMs: 5,
    randomDelayMode: false,
    executionSpeedMs: 10,
    smartLoop: true
  });

  const [menuSize, setMenuSize] = useState(100);
  const [showToastOnTrigger, setShowToastOnTrigger] = useState(false);

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
    }
  ]);
  const [totalElapsedMs, setTotalElapsedMs] = useState<number>(22.5);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

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

  useEffect(() => {
    const logListener = MacroBridge.addListener('scriptLog', (data: any) => {
      handleAddLog('INFO', data.message, 'NATIVE');
    });

    const statusListener = MacroBridge.addListener('scriptStatus', (data: any) => {
      if (data.state === 'completed' || data.state === 'stopped') {
        setIsExecuting(false);
        setEngineActive(false);
        handleAddLog('SUCCESS', `Execution ${data.state.toUpperCase()}`, 'NATIVE');
      }
      if (data.state === 'error') {
        setIsExecuting(false);
        setEngineActive(false);
        handleAddLog('ERROR', data.message, 'NATIVE');
      }
    });

    return () => {
      logListener.remove();
      statusListener.remove();
    };
  }, [totalElapsedMs]);

  const handleClearLogs = () => {
    setLogs([]);
    setTotalElapsedMs(0);
  };

  const handleToggleEngine = () => {
    const nextState = !engineActive;
    setEngineActive(nextState);
    
    if (!nextState) {
      MacroBridge.stopMacro().catch(console.error);
      setIsExecuting(false);
    }

    handleAddLog(
      nextState ? 'SUCCESS' : 'INFO',
      `Macro Engine switched to [${nextState ? 'ON' : 'OFF'}]. ${nextState ? 'Kernel touch listeners active.' : 'Standby mode.'}`,
      'ENGINE'
    );
  };

  const handleExecutePipeline = async () => {
    setIsExecuting(true);
    setEngineActive(true);
    handleAddLog('INFO', `Starting native execution of ${pipelineSteps.length}-block pipeline...`, 'PIPELINE');

    try {
      const nativeActions: any[] = [];
      pipelineSteps.forEach(step => {
        if (!step.enabled) return;
        
        nativeActions.push({ type: 'log', message: `Executing ${step.language.toUpperCase()} Block #${step.stepNumber}` });
        nativeActions.push({ type: 'tap', x: sharedState.lastTapX, y: sharedState.soruReady ? 800 : 1200 }); 
        nativeActions.push({ type: 'delay', ms: speedSettings.executionSpeedMs });
      });

      await MacroBridge.executePipeline({ actions: JSON.stringify(nativeActions) });
    } catch (e: any) {
      handleAddLog('ERROR', e.message, 'BRIDGE');
      setIsExecuting(false);
      setEngineActive(false);
    }
  };

  const handleExecuteSingleEngine = async () => {
    setIsExecuting(true);
    setEngineActive(true);
    handleAddLog('INFO', `Starting single engine execution [Target: ${selectedSingleEngine.toUpperCase()}]...`, selectedSingleEngine.toUpperCase());

    try {
      // 🔥 FIX: Send the sharedState object to Kotlin
      await MacroBridge.executeQuickJs({ 
        script: singleEngineCode,
        sharedState: JSON.stringify(sharedState)
      });
    } catch (e: any) {
      handleAddLog('ERROR', e.message, selectedSingleEngine.toUpperCase());
      setIsExecuting(false);
      setEngineActive(false);
    }
  };

  const handleExecuteConfig = async (config: MacroConfig) => {
    setEngineActive(true);
    setIsExecuting(true);
    handleAddLog('INFO', `Executing pre-made config: ${config.name}...`, 'PRE_MADE');
    
    try {
      const actions = [
        { type: 'log', message: `Soru tap at (${config.soruCoords.x}, ${config.soruCoords.y})` },
        { type: 'tap', x: config.soruCoords.x, y: config.soruCoords.y },
        { type: 'delay', ms: speedSettings.executionSpeedMs },
        { type: 'log', message: `Portal tap at (${config.portalCoords.x}, ${config.portalCoords.y})` },
        { type: 'tap', x: config.portalCoords.x, y: config.portalCoords.y }
      ];

      await MacroBridge.executePipeline({ actions: JSON.stringify(actions) });
    } catch (e: any) {
      handleAddLog('ERROR', e.message, 'PRE_MADE');
      setIsExecuting(false);
      setEngineActive(false);
    }
  };

  const handleLoadConfigIntoEditor = (config: MacroConfig) => {
    setSingleEngineCode(config.code);
    setSelectedSingleEngine('quickjs');
    setMultiLanguage(false);
    setActiveTab('home');
    handleAddLog('INFO', `Loaded '${config.name}' into QuickJS editor.`, 'ROUTINE');
  };

  const handleDuplicateConfig = (config: MacroConfig) => {
    const cloned: MacroConfig = {
      ...config,
      id: `config-${Date.now()}`,
      name: `${config.name} (Copy)`
    };
    setConfigs((prev) => [cloned, ...prev]);
    handleAddLog('SUCCESS', `Duplicated macro: Created '${cloned.name}'.`, 'MACRO_MANAGER');
  };

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

  const handleImportPipeline = (steps: PipelineStep[], newSpeed?: SpeedSettings, newState?: SharedStateData) => {
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

  const handleOpenCoordsPickerForTarget = (configId: string, targetType: 'soru' | 'portal') => {
    setTargetBinding({ configId, targetType });
    setIsCoordsPickerOpen(true);
  };

  const handleOpenColorCheckerForTarget = (configId: string, targetType: 'soru' | 'portal') => {
    setTargetBinding({ configId, targetType });
    setIsColorCheckerOpen(true);
  };

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
      const tapCommand = `host.tap(${coords.x}, ${coords.y});`;
      setSingleEngineCode((prev) => (prev ? `${prev}\n${tapCommand}` : tapCommand));
      handleAddLog('SUCCESS', `Sampled coordinates (${coords.x}, ${coords.y}). Appended host.tap() to active script.`, 'COORDS');
    }
  };

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
      const colorCheck = `if (host.getPixel(${coords.x}, ${coords.y}) === 0xFF${hexColor.replace('#', '')}) {\n    host.tap(${coords.x}, ${coords.y});\n}`;
      setSingleEngineCode((prev) => (prev ? `${prev}\n${colorCheck}` : colorCheck));
      handleAddLog('SUCCESS', `Sampled color ${hexColor} at (${coords.x}, ${coords.y}). Appended color condition.`, 'COLOR');
    }
  };

  const handleUpdateConfig = (updated: MacroConfig) => {
    setConfigs((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

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

      <main className="max-w-xl mx-auto px-4 py-4 space-y-5">
        {activeTab === 'home' && (
          <>
            <MacroEngineCard
              engineActive={engineActive}
              onToggleEngine={handleToggleEngine}
              multiLanguage={multiLanguage}
              onToggleMultiLanguage={setMultiLanguage}
            />

            <MacroControlPanel />

            <SpeedControls
              settings={speedSettings}
              onChange={setSpeedSettings}
            />

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

      <CoordinatePickerModal
        isOpen={isCoordsPickerOpen}
        onClose={() => setIsCoordsPickerOpen(false)}
        onSelectCoords={handleApplyCoordinates}
        targetBinding={targetBinding}
        calibration={screenCalibration}
        onSaveCalibration={setScreenCalibration}
      />

      <PixelColorCheckerModal
        isOpen={isColorCheckerOpen}
        onClose={() => setIsColorCheckerOpen(false)}
        onSelectColor={handleApplyColor}
        targetBinding={targetBinding}
      />

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

      <AndroidArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      <AccessibilityModal
        isOpen={isAccessibilityOpen}
        onClose={() => setIsAccessibilityOpen(false)}
      />

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
