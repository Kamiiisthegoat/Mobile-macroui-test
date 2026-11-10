import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  Copy,
  Check,
  FileCode2,
  AlertCircle,
  CheckCircle2,
  Share2,
  Sparkles,
  ArrowRight,
  FileUp,
  FileDown,
  Code2,
  PlusCircle,
  Play
} from 'lucide-react';
import {
  MacroConfig,
  PipelineStep,
  SpeedSettings,
  SharedStateData,
  ExportFormat,
  ScriptLanguage,
  UniversalImportResult,
  ExportedSuiteFile,
  ExportedPipelineFile
} from '../types/macro';
import {
  LANGUAGE_FILE_DEFINITIONS,
  createMacroExportPackage,
  createPipelineExportPackage,
  createSuiteExportPackage,
  formatCodeAsLanguage,
  parseUniversalImport,
  downloadLanguageFile
} from '../engine/exportImportEngine';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineSteps: PipelineStep[];
  configs: MacroConfig[];
  speedSettings: SpeedSettings;
  sharedState: SharedStateData;
  singleEngineCode?: string;
  selectedSingleEngine?: ScriptLanguage;
  preSelectedMacro?: MacroConfig | null;
  initialTab?: 'export' | 'import' | 'presets';
  initialLanguage?: ExportFormat;
  onImportPipeline: (steps: PipelineStep[], speedSettings?: SpeedSettings, sharedState?: SharedStateData) => void;
  onImportMacro: (macro: MacroConfig) => void;
  onImportSuite: (suite: ExportedSuiteFile) => void;
  onImportSingleCode: (code: string, language: ScriptLanguage) => void;
  onAddPipelineStep: (step: PipelineStep) => void;
  onLog: (level: 'INFO' | 'SUCCESS' | 'GESTURE' | 'SHARED_STATE' | 'WARN' | 'ERROR', message: string, engine?: string) => void;
}

// Curated community automation routines ready to import
const COMMUNITY_PRESETS = [
  {
    id: 'preset-soru-ndk',
    name: 'Soru-X Ultra Flash-Step (NDK Evdev + QuickJS)',
    author: 'AutoSys_Pro',
    description: 'Instant zero-latency JNI evdev flash-step combo optimized for Blox Fruits Soru skill cooldown.',
    category: 'Combat / PvP',
    primaryFormat: 'cpp' as ExportFormat,
    languages: ['cpp', 'quickjs'],
    rawCode: `// High-speed evdev touch injection
nativeTap(540.0f, 1120.0f, 15);
sharedState["lastTapX"] = 540;
sharedState["soruReady"] = false;`,
    package: {
      version: '1.0',
      type: 'pipeline',
      name: 'Soru-X Ultra Flash-Step (NDK Evdev + QuickJS)',
      description: 'Instant zero-latency JNI evdev flash-step combo',
      exportedAt: '2026-11-09T12:00:00.000Z',
      speedSettings: {
        triggerDelayMs: 5,
        randomDelayMode: false,
        executionSpeedMs: 5,
        smartLoop: true
      },
      sharedState: {
        lastTapX: 540,
        soruReady: true,
        comboStreak: 3
      },
      steps: [
        {
          id: 'step-preset-1',
          stepNumber: 1,
          language: 'cpp' as ScriptLanguage,
          targetDesc: 'target: cpp',
          enabled: true,
          code: '// 1. Hardware-level evdev touch event injection\nnativeTap(540.0f, 1120.0f, 15);\nsharedState["lastTapX"] = 540;\nsharedState["soruReady"] = false;'
        },
        {
          id: 'step-preset-2',
          stepNumber: 2,
          language: 'quickjs' as ScriptLanguage,
          targetDesc: 'target: quickjs',
          enabled: true,
          code: '// 2. High-speed target verification\nwait(50);\ntap(240, 680);\nsharedState["soruReady"] = true;\nconsole.log("[QuickJS] Soru-X combo finished.");'
        }
      ]
    }
  },
  {
    id: 'preset-soru-luau',
    name: 'Soru-X Luau Rapid Dash (Roblox Luau)',
    author: 'BloxHacker99',
    description: 'Roblox Luau client script for coordinate calculation and high-speed Soru dash chaining.',
    category: 'Combat / PvP',
    primaryFormat: 'luau' as ExportFormat,
    languages: ['luau', 'quickjs'],
    rawCode: `-- 1. Luau state validation & Soru coordinates calc
local targetX = sharedState.soruX or 540
local targetY = sharedState.soruY or 1120
task.wait(0.04)
bridge.tap(targetX, targetY)`,
    package: {
      version: '1.0',
      type: 'pipeline',
      name: 'Soru-X Luau Rapid Dash Routine',
      description: 'Rapid Soru dash script for Luau Roblox engine',
      exportedAt: '2026-11-09T14:30:00.000Z',
      speedSettings: {
        triggerDelayMs: 5,
        randomDelayMode: false,
        executionSpeedMs: 5,
        smartLoop: true
      },
      sharedState: {
        soruX: 540,
        soruY: 1120,
        soruReady: true
      },
      steps: [
        {
          id: 'step-preset-soru-luau-1',
          stepNumber: 1,
          language: 'luau' as ScriptLanguage,
          targetDesc: 'target: luau',
          enabled: true,
          code: '-- 1. Luau Soru flash-step calculation\nlocal targetX = sharedState.soruX or 540\nlocal targetY = sharedState.soruY or 1120\nwait(40)\ntap(targetX, targetY)'
        },
        {
          id: 'step-preset-soru-luau-2',
          stepNumber: 2,
          language: 'quickjs' as ScriptLanguage,
          targetDesc: 'target: quickjs',
          enabled: true,
          code: '// 2. QuickJS confirmation and rapid reset\nwait(30);\nsharedState["soruReady"] = true;\nconsole.log("[QuickJS] Soru dash validated.");'
        }
      ]
    }
  },
  {
    id: 'preset-soru-evade',
    name: 'Soru-X Evasion & Rapid Counter (Kotlin + C++)',
    author: 'InstinctMaster',
    description: 'Kotlin Android Accessibility routine executing Soru-X rapid evasion and counter.',
    category: 'Combat / PvP',
    primaryFormat: 'kt' as ExportFormat,
    languages: ['kt', 'cpp'],
    rawCode: `// Kotlin Android AccessibilityService gesture injection for Soru-X
if (sharedState["soruReady"] == true) {
    AutomationBridge.injectTap(540f, 1120f)
    AutomationBridge.injectSwipe(540f, 1120f, 200f, 1120f, 40)
}`,
    package: {
      version: '1.0',
      type: 'pipeline',
      name: 'Soru-X Evasion & Counter Combo',
      description: 'High-speed evasion routine',
      exportedAt: '2026-11-09T16:00:00.000Z',
      speedSettings: {
        triggerDelayMs: 5,
        randomDelayMode: false,
        executionSpeedMs: 5,
        smartLoop: true
      },
      sharedState: {
        soruX: 540,
        soruY: 1120,
        soruReady: true
      },
      steps: [
        {
          id: 'step-preset-soru-evade-1',
          stepNumber: 1,
          language: 'cpp' as ScriptLanguage,
          targetDesc: 'target: cpp',
          enabled: true,
          code: '// Native JNI evdev instant tap\nnativeTap(540.0f, 1120.0f, 12);\nsharedState["soruReady"] = false;'
        },
        {
          id: 'step-preset-soru-evade-2',
          stepNumber: 2,
          language: 'kt' as ScriptLanguage,
          targetDesc: 'target: kt',
          enabled: true,
          code: '// Kotlin Accessibility swipe\nAutomationBridge.injectSwipe(540, 1120, 200, 1120, 40)\nsharedState["soruReady"] = true'
        }
      ]
    }
  }
];

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  pipelineSteps,
  configs,
  speedSettings,
  sharedState,
  singleEngineCode = '',
  selectedSingleEngine = 'quickjs',
  preSelectedMacro,
  initialTab = 'export',
  initialLanguage = 'json',
  onImportPipeline,
  onImportMacro,
  onImportSuite,
  onImportSingleCode,
  onAddPipelineStep,
  onLog
}) => {
  const [tab, setTab] = useState<'export' | 'import' | 'presets'>(initialTab);
  const [exportSource, setExportSource] = useState<'pipeline' | 'single_macro' | 'single_editor' | 'suite'>('pipeline');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(initialLanguage);
  const [selectedMacroId, setSelectedMacroId] = useState<string>(
    preSelectedMacro?.id || configs[0]?.id || ''
  );

  // Import State
  const [importInput, setImportInput] = useState<string>('');
  const [uploadedFilename, setUploadedFilename] = useState<string>('');
  const [importResult, setImportResult] = useState<UniversalImportResult | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (preSelectedMacro) {
      setExportSource('single_macro');
      setSelectedMacroId(preSelectedMacro.id);
    }
  }, [preSelectedMacro]);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      if (initialLanguage) setSelectedFormat(initialLanguage);
    }
  }, [isOpen, initialTab, initialLanguage]);

  // Live validation on import text input change
  useEffect(() => {
    if (!importInput.trim()) {
      setImportResult(null);
      return;
    }
    const result = parseUniversalImport(importInput, uploadedFilename);
    setImportResult(result);
  }, [importInput, uploadedFilename]);

  if (!isOpen) return null;

  const activeMacro = configs.find((c) => c.id === selectedMacroId) || configs[0];
  const langDef = LANGUAGE_FILE_DEFINITIONS[selectedFormat];

  // Generate Export Code & Metadata
  const generateExportContent = (): { content: string; filename: string; title: string } => {
    const timeStr = Date.now();

    // Case 1: Universal JSON Export
    if (selectedFormat === 'json') {
      if (exportSource === 'pipeline') {
        const pkg = createPipelineExportPackage(pipelineSteps, {
          name: 'MacroExecutor Multi-Language Pipeline',
          speedSettings,
          sharedState
        });
        return {
          content: JSON.stringify(pkg, null, 2),
          filename: `pipeline_${timeStr}.json`,
          title: 'Multi-Language Pipeline (JSON)'
        };
      } else if (exportSource === 'single_macro' && activeMacro) {
        const pkg = createMacroExportPackage(activeMacro);
        const cleanName = activeMacro.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        return {
          content: JSON.stringify(pkg, null, 2),
          filename: `macro_${cleanName}_${timeStr}.json`,
          title: `${activeMacro.name} (JSON)`
        };
      } else if (exportSource === 'single_editor') {
        const singlePkg = {
          version: '1.0',
          type: 'single_script',
          language: selectedSingleEngine,
          code: singleEngineCode,
          exportedAt: new Date().toISOString()
        };
        return {
          content: JSON.stringify(singlePkg, null, 2),
          filename: `script_${selectedSingleEngine}_${timeStr}.json`,
          title: `${selectedSingleEngine.toUpperCase()} Script (JSON)`
        };
      } else {
        const pkg = createSuiteExportPackage({
          name: 'MacroExecutor Full Suite Profile',
          speedSettings,
          configs,
          pipelineSteps,
          sharedState,
          singleEngineCode,
          selectedSingleEngine
        });
        return {
          content: JSON.stringify(pkg, null, 2),
          filename: `macro_suite_profile_${timeStr}.json`,
          title: 'Complete Suite Profile (JSON)'
        };
      }
    }

    // Case 2: Native Coding Language (C++, Luau, QuickJS, JS, Kotlin)
    let rawCodeToExport = '';
    let routineTitle = '';

    if (exportSource === 'pipeline') {
      routineTitle = 'Multi_Language_Pipeline';
      rawCodeToExport = pipelineSteps
        .map((step) => `// --- Step ${step.stepNumber} [${step.language.toUpperCase()}] ---\n${step.code}`)
        .join('\n\n');
    } else if (exportSource === 'single_macro' && activeMacro) {
      routineTitle = activeMacro.name.replace(/[^a-zA-Z0-9]/g, '_');
      rawCodeToExport = activeMacro.code;
    } else {
      routineTitle = `Routine_${selectedFormat.toUpperCase()}`;
      rawCodeToExport = singleEngineCode || '// Empty automation routine';
    }

    const formattedCode = formatCodeAsLanguage(
      routineTitle,
      rawCodeToExport,
      selectedFormat,
      {
        delayMs: speedSettings.executionSpeedMs,
        coords: activeMacro ? { soru: activeMacro.soruCoords, portal: activeMacro.portalCoords } : undefined,
        colors: activeMacro ? { soru: activeMacro.soruColor, portal: activeMacro.portalColor } : undefined
      }
    );

    const ext = langDef.extension;
    const cleanFilename = `${routineTitle.toLowerCase()}_${timeStr}${ext}`;

    return {
      content: formattedCode,
      filename: cleanFilename,
      title: `${routineTitle} (${langDef.label})`
    };
  };

  const { content: currentExportContent, filename: currentExportFilename, title: currentExportTitle } =
    generateExportContent();

  const handleDownload = () => {
    downloadLanguageFile(currentExportContent, currentExportFilename, selectedFormat);
    onLog('SUCCESS', `Exported script file downloaded: ${currentExportFilename} [${selectedFormat.toUpperCase()}]`, 'EXPORTER');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentExportContent);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
    onLog('SUCCESS', `Export code copied to clipboard (${currentExportContent.length} chars)`, 'EXPORTER');
  };

  // Handle File Upload for any language (.json, .cpp, .luau, .qjs, .js, .kt)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFilename(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setImportInput(content);
        setTab('import');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setUploadedFilename(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setImportInput(content);
          setTab('import');
        }
      };
      reader.readAsText(file);
    }
  };

  // Perform Import according to target destination
  const handleApplyImport = (targetDestination: 'pipeline' | 'single_editor' | 'add_block' | 'save_template') => {
    if (!importResult || !importResult.isValid) return;

    const { format, code, parsedPackage, detectedLanguage } = importResult;

    // If it's a JSON package
    if (parsedPackage) {
      if (parsedPackage.type === 'pipeline') {
        const p = parsedPackage as ExportedPipelineFile;
        onImportPipeline(p.steps, p.speedSettings, p.sharedState);
        onLog('SUCCESS', `Loaded pipeline with ${p.steps.length} execution blocks from JSON.`, 'IMPORTER');
        onClose();
        return;
      }
      if (parsedPackage.type === 'macro_suite') {
        onImportSuite(parsedPackage as ExportedSuiteFile);
        onLog('SUCCESS', `Restored full MacroExecutor suite profile from JSON.`, 'IMPORTER');
        onClose();
        return;
      }
      if (parsedPackage.type === 'single_macro') {
        onImportMacro(parsedPackage.macro);
        onLog('SUCCESS', `Imported macro '${parsedPackage.macro.name}' to templates.`, 'IMPORTER');
        onClose();
        return;
      }
    }

    // It's a native script (C++, Luau, QuickJS, JS, Kotlin) or custom code snippet!
    const targetScriptLang: ScriptLanguage = detectedLanguage || (format === 'json' ? 'quickjs' : (format as ScriptLanguage));

    if (targetDestination === 'pipeline') {
      const newStep: PipelineStep = {
        id: `step-imp-${Date.now()}`,
        stepNumber: pipelineSteps.length + 1,
        language: targetScriptLang,
        targetDesc: `target: ${targetScriptLang}`,
        enabled: true,
        code
      };
      onImportPipeline([...pipelineSteps, newStep]);
      onLog('SUCCESS', `Appended imported ${targetScriptLang.toUpperCase()} script as Pipeline Block #${pipelineSteps.length + 1}.`, 'IMPORTER');
      onClose();
    } else if (targetDestination === 'add_block') {
      const newStep: PipelineStep = {
        id: `step-imp-${Date.now()}`,
        stepNumber: pipelineSteps.length + 1,
        language: targetScriptLang,
        targetDesc: `target: ${targetScriptLang}`,
        enabled: true,
        code
      };
      onAddPipelineStep(newStep);
      onLog('SUCCESS', `Created new ${targetScriptLang.toUpperCase()} pipeline block from imported code.`, 'IMPORTER');
      onClose();
    } else if (targetDestination === 'single_editor') {
      onImportSingleCode(code, targetScriptLang);
      onLog('SUCCESS', `Loaded imported ${targetScriptLang.toUpperCase()} script into Single Engine Editor.`, 'IMPORTER');
      onClose();
    } else if (targetDestination === 'save_template') {
      const newMacro: MacroConfig = {
        id: `macro-custom-${Date.now()}`,
        name: importResult.title || `Custom ${targetScriptLang.toUpperCase()} Routine`,
        description: `Imported ${targetScriptLang.toUpperCase()} code file`,
        engine: targetScriptLang.toUpperCase(),
        soruCoords: { x: 185, y: 450 },
        portalCoords: { x: 240, y: 680 },
        soruColor: '#E63946',
        portalColor: '#457B9D',
        code,
        category: 'combat'
      };
      onImportMacro(newMacro);
      onLog('SUCCESS', `Saved imported ${targetScriptLang.toUpperCase()} script as new pre-made template.`, 'IMPORTER');
      onClose();
    }
  };

  const handleLoadPreset = (preset: typeof COMMUNITY_PRESETS[0]) => {
    setUploadedFilename(`${preset.id}.${LANGUAGE_FILE_DEFINITIONS[preset.primaryFormat].extension}`);
    setImportInput(JSON.stringify(preset.package, null, 2));
    setTab('import');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 pt-14 sm:pt-6 pb-8 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f1118] border border-[#212536] rounded-2xl w-full max-w-2xl max-h-[82dvh] sm:max-h-[88vh] flex flex-col shadow-2xl overflow-hidden shrink-0 mt-2 sm:my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1c2030] bg-[#121520]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 tracking-wide uppercase">
                  Custom Multi-Language Code Exporter & Importer
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  ALL ENGINES
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Export and import routines in C++, Luau, QuickJS, JavaScript, Kotlin, or Unified JSON
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-[#1a1d2c] transition-colors"
            aria-label="Close Export Import Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#1a1d2c] bg-[#10121b]">
          <button
            onClick={() => setTab('export')}
            className={`py-2 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-t border-x ${
              tab === 'export'
                ? 'bg-[#151824] text-cyan-300 border-[#262b3d] -mb-[1px] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileDown className="w-3.5 h-3.5" />
            Export Code / Files
          </button>

          <button
            onClick={() => setTab('import')}
            className={`py-2 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-t border-x ${
              tab === 'import'
                ? 'bg-[#151824] text-emerald-300 border-[#262b3d] -mb-[1px] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            Import Any Language
            {importResult?.isValid && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setTab('presets')}
            className={`py-2 px-4 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-t border-x ${
              tab === 'presets'
                ? 'bg-[#151824] text-amber-300 border-[#262b3d] -mb-[1px] shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Community Presets
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* ================= TAB 1: EXPORT ================= */}
          {tab === 'export' && (
            <div className="space-y-4">
              {/* Target Format / Language Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300">
                    1. Choose Output Coding Language / File Format:
                  </span>
                  <span className="font-mono text-[10px] text-cyan-300">
                    Extension: {langDef.extension}
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(Object.keys(LANGUAGE_FILE_DEFINITIONS) as ExportFormat[]).map((format) => {
                    const def = LANGUAGE_FILE_DEFINITIONS[format];
                    const isSelected = selectedFormat === format;
                    return (
                      <button
                        key={format}
                        onClick={() => setSelectedFormat(format)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-500/60 text-cyan-200 shadow-sm'
                            : 'bg-[#131622] border-[#202536] text-slate-400 hover:bg-[#181c2c] hover:text-slate-200'
                        }`}
                      >
                        <div className="text-xs font-mono font-bold uppercase">
                          {def.extension}
                        </div>
                        <div className="text-[10px] truncate mt-0.5 font-medium">
                          {format === 'quickjs' ? 'QJS' : format.toUpperCase()}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  {langDef.label}: {langDef.syntaxDesc}
                </p>
              </div>

              {/* Source Content to Export */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-bold text-slate-300">
                  2. Choose What Routine to Export:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => setExportSource('pipeline')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      exportSource === 'pipeline'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                        : 'bg-[#131622] border-[#202536] text-slate-300 hover:bg-[#181c2c]'
                    }`}
                  >
                    <div className="text-xs font-bold">Pipeline</div>
                    <div className="text-[10px] text-slate-400">{pipelineSteps.length} Blocks</div>
                  </button>

                  <button
                    onClick={() => setExportSource('single_macro')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      exportSource === 'single_macro'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                        : 'bg-[#131622] border-[#202536] text-slate-300 hover:bg-[#181c2c]'
                    }`}
                  >
                    <div className="text-xs font-bold">Pre-Made Macro</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {activeMacro?.name || 'Selected'}
                    </div>
                  </button>

                  <button
                    onClick={() => setExportSource('single_editor')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      exportSource === 'single_editor'
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-200'
                        : 'bg-[#131622] border-[#202536] text-slate-300 hover:bg-[#181c2c]'
                    }`}
                  >
                    <div className="text-xs font-bold">Active Editor</div>
                    <div className="text-[10px] text-slate-400">Current script</div>
                  </button>

                  <button
                    onClick={() => {
                      setExportSource('suite');
                      setSelectedFormat('json');
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      exportSource === 'suite'
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                        : 'bg-[#131622] border-[#202536] text-slate-300 hover:bg-[#181c2c]'
                    }`}
                  >
                    <div className="text-xs font-bold">Full Profile</div>
                    <div className="text-[10px] text-amber-400/80">Complete Suite</div>
                  </button>
                </div>
              </div>

              {/* Sub-selector for Single Macro */}
              {exportSource === 'single_macro' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400">
                    Choose Pre-Made Routine:
                  </label>
                  <select
                    value={selectedMacroId}
                    onChange={(e) => setSelectedMacroId(e.target.value)}
                    className="w-full bg-[#131622] border border-[#202536] rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-cyan-500/50"
                  >
                    {configs.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.engine})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Live Code Preview Window */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
                    Generated {langDef.label} Code:
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    {currentExportFilename} · {currentExportContent.split('\n').length} lines
                  </span>
                </div>

                <div className="relative rounded-xl border border-[#212638] bg-[#090a10] overflow-hidden">
                  <pre className="p-3.5 max-h-56 overflow-auto text-[11px] font-mono text-cyan-300/90 leading-relaxed selection:bg-cyan-900/40">
                    <code>{currentExportContent}</code>
                  </pre>
                </div>
              </div>

              {/* Export Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleDownload}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-[0.99]"
                >
                  <Download className="w-4 h-4" />
                  Download {langDef.extension} File
                </button>

                <button
                  onClick={handleCopy}
                  className="py-2.5 px-4 rounded-xl bg-[#171a27] hover:bg-[#202536] text-slate-200 border border-[#2b3147] font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copyFeedback ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB 2: IMPORT ================= */}
          {tab === 'import' && (
            <div className="space-y-4">
              {/* Drop Zone & File Upload for all languages */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-emerald-400 bg-emerald-500/10'
                    : 'border-[#22273a] bg-[#11131c] hover:border-emerald-500/50 hover:bg-[#141724]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.cpp,.c,.h,.luau,.lua,.qjs,.js,.kt,.kts,text/*,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload className="w-6 h-6 mx-auto mb-2 text-emerald-400" />
                <p className="text-xs font-bold text-slate-200">
                  Click to Browse or Drag & Drop Any Code or JSON File
                </p>
                <div className="flex items-center justify-center gap-1.5 mt-1.5 flex-wrap">
                  {['.cpp', '.luau', '.qjs', '.js', '.kt', '.json'].map((ext) => (
                    <span
                      key={ext}
                      className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1c2132] text-slate-300 border border-[#272e44]"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              {/* Paste Raw Code / JSON */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-300">
                    Or Paste Code Snippet (C++, Luau, QuickJS, Kotlin, or JSON):
                  </label>
                  {importInput && (
                    <button
                      onClick={() => {
                        setImportInput('');
                        setUploadedFilename('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-200"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <textarea
                  value={importInput}
                  onChange={(e) => setImportInput(e.target.value)}
                  placeholder="Paste C++, Luau, QuickJS, Kotlin, or JSON code here..."
                  rows={6}
                  className="w-full bg-[#090a10] border border-[#212638] rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y"
                />
              </div>

              {/* Universal Language Detection Card */}
              {importResult && (
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    importResult.isValid
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {importResult.isValid ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    )}

                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {importResult.isValid ? 'Recognized Code Routine' : 'Import Error'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                            FORMAT: {importResult.format.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {importResult.isValid ? (
                        <>
                          <div className="text-xs font-semibold text-slate-100">
                            {importResult.title}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {importResult.description}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-rose-300">{importResult.error}</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Import Destination Actions */}
              {importResult?.isValid && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-bold text-slate-300">
                    Select Import Destination:
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => handleApplyImport('pipeline')}
                      className="py-2.5 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-[0.99]"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Add to Pipeline Blocks
                    </button>

                    <button
                      onClick={() => handleApplyImport('single_editor')}
                      className="py-2.5 px-3.5 rounded-xl bg-[#181d2c] hover:bg-[#23293e] text-cyan-300 border border-cyan-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                    >
                      <Code2 className="w-4 h-4" />
                      Load into Single Engine Editor
                    </button>

                    <button
                      onClick={() => handleApplyImport('save_template')}
                      className="py-2.5 px-3.5 rounded-xl bg-[#161a27] hover:bg-[#1f2436] text-slate-200 border border-[#2a3045] font-semibold text-xs flex items-center justify-center gap-2 transition-colors sm:col-span-2"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Save as New Pre-Made Template Routine
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: COMMUNITY PRESETS ================= */}
          {tab === 'presets' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300">
                  Ready-to-Use Tested Multi-Language Routines:
                </span>
                <span className="text-[11px] text-amber-400 font-medium">
                  Click to inspect & load
                </span>
              </div>

              <div className="space-y-3">
                {COMMUNITY_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3.5 rounded-xl border border-[#202536] bg-[#121520] hover:border-amber-500/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100">
                            {preset.name}
                          </h4>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {preset.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {preset.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleLoadPreset(preset)}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <span>Inspect & Load</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-[#1a1e2d]">
                      <span>Shared by: @{preset.author}</span>
                      <div className="flex items-center gap-1">
                        <span>Languages:</span>
                        {preset.languages.map((l) => (
                          <span
                            key={l}
                            className="font-mono uppercase font-bold text-slate-400 px-1 py-0.2 rounded bg-[#181c2b]"
                          >
                            {l}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1c2030] bg-[#11131c] flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Engines: C++ · Luau · QuickJS · JS · Kotlin · JSON
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-[#181a26] hover:bg-[#202434] text-slate-300 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
