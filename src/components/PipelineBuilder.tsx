import React, { useState, useEffect, useRef } from 'react';
import { PipelineStep, ScriptLanguage, SharedStateData, SpeedSettings } from '../types/macro';
import { generateSnippet, executeStepDebugger } from '../engine/pipelineEngine';
import {
  Play,
  Crosshair,
  Copy,
  Download,
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Check,
  Eye,
  SkipForward,
  Pause,
  RotateCcw,
  Sparkles,
  Camera,
  Share2,
  FileUp,
  SlidersHorizontal
} from 'lucide-react';
import { EditorActionsOverlay } from './EditorActionsOverlay';

interface PipelineBuilderProps {
  steps: PipelineStep[];
  onUpdateSteps: (steps: PipelineStep[]) => void;
  onExecute: () => void;
  onOpenPicker: () => void;
  isExecuting: boolean;
  sharedState: SharedStateData;
  onUpdateSharedState: (newState: SharedStateData) => void;
  speedSettings: SpeedSettings;
  onLog: (level: 'INFO' | 'SUCCESS' | 'GESTURE' | 'SHARED_STATE' | 'WARN' | 'ERROR', msg: string, engine?: string) => void;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
}

const LANGUAGES: Array<{ key: ScriptLanguage; label: string }> = [
  { key: 'cpp', label: 'C++' },
  { key: 'luau', label: 'Luau' },
  { key: 'quickjs', label: 'QJS' },
  { key: 'js', label: 'JS' },
  { key: 'kt', label: 'KT' }
];

export const PipelineBuilder: React.FC<PipelineBuilderProps> = ({
  steps,
  onUpdateSteps,
  onExecute,
  onOpenPicker,
  isExecuting,
  sharedState,
  onUpdateSharedState,
  speedSettings,
  onLog,
  onOpenExport,
  onOpenImport
}) => {
  const [activeStepId, setActiveStepId] = useState<string>(steps[0]?.id || '');
  const [copied, setCopied] = useState(false);
  const [isActionsOverlayOpen, setIsActionsOverlayOpen] = useState(false);
  const [showStateInspector, setShowStateInspector] = useState(true);

  // Step-by-Step Visual Debugger State
  const [activeDebugStepIndex, setActiveDebugStepIndex] = useState<number | null>(null);
  const [isStepDebugging, setIsStepDebugging] = useState<boolean>(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [recentlyMutatedKeys, setRecentlyMutatedKeys] = useState<string[]>([]);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLanguageChange = (stepId: string, lang: ScriptLanguage) => {
    onUpdateSteps(
      steps.map((s) =>
        s.id === stepId
          ? {
              ...s,
              language: lang,
              targetDesc: `target: ${lang}`,
              code: s.code || generateSnippet('tap', lang)
            }
          : s
      )
    );
  };

  const handleCodeChange = (stepId: string, newCode: string) => {
    onUpdateSteps(
      steps.map((s) => (s.id === stepId ? { ...s, code: newCode } : s))
    );
  };

  const handleInjectSnippet = (action: 'tap' | 'hold' | 'swipe' | 'wait' | 'loop' | 'snapshot') => {
    const targetStep = steps.find((s) => s.id === activeStepId) || steps[0];
    if (!targetStep) return;

    const snippet = generateSnippet(action, targetStep.language);
    const updatedCode = targetStep.code ? `${targetStep.code}\n${snippet}` : snippet;

    handleCodeChange(targetStep.id, updatedCode);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === steps.length - 1)) {
      return;
    }
    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = newSteps[index];
    newSteps[index] = newSteps[targetIndex];
    newSteps[targetIndex] = temp;

    newSteps.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });

    onUpdateSteps(newSteps);
  };

  const handleDeleteStep = (stepId: string) => {
    if (steps.length <= 1) return;
    const filtered = steps.filter((s) => s.id !== stepId);
    filtered.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });
    onUpdateSteps(filtered);
    if (activeStepId === stepId) {
      setActiveStepId(filtered[0].id);
    }
  };

  const handleAddStep = () => {
    const newNumber = steps.length + 1;
    const defaultLang: ScriptLanguage = steps.length % 2 === 0 ? 'cpp' : 'luau';
    const newStep: PipelineStep = {
      id: `step-${Date.now()}`,
      stepNumber: newNumber,
      language: defaultLang,
      targetDesc: `target: ${defaultLang}`,
      enabled: true,
      code: generateSnippet('tap', defaultLang)
    };
    onUpdateSteps([...steps, newStep]);
    setActiveStepId(newStep.id);
  };

  // --- Step-by-Step Visual Debugger Mechanics ---
  const handleStartDebugging = () => {
    setIsStepDebugging(true);
    setActiveDebugStepIndex(0);
    onLog('INFO', '[DEBUGGER] Visual debugger engaged. Stepping into Block #1...', 'DEBUGGER');
  };

  const handleStepNext = () => {
    const currentIndex = activeDebugStepIndex !== null ? activeDebugStepIndex : 0;
    if (currentIndex >= steps.length) {
      onLog('SUCCESS', '[DEBUGGER] Reached end of pipeline execution.', 'DEBUGGER');
      setIsStepDebugging(false);
      setActiveDebugStepIndex(null);
      return;
    }

    const currentStep = steps[currentIndex];
    const result = executeStepDebugger(currentStep, sharedState, speedSettings, currentIndex);

    // Track mutated keys for glowing animation
    const mutated = Object.keys(result.updatedState).filter(
      (k) => result.updatedState[k] !== sharedState[k]
    );
    setRecentlyMutatedKeys(mutated);
    setTimeout(() => setRecentlyMutatedKeys([]), 1800);

    onUpdateSharedState(result.updatedState);
    result.logs.forEach((log) => onLog(log.level, log.message, log.engine));

    if (currentIndex + 1 < steps.length) {
      setActiveDebugStepIndex(currentIndex + 1);
    } else {
      onLog('SUCCESS', `[DEBUGGER] Pipeline execution complete (${steps.length} blocks).`, 'DEBUGGER');
      setActiveDebugStepIndex(null);
      setIsStepDebugging(false);
      setIsAutoPlaying(false);
    }
  };

  const handleResetDebugger = () => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    setIsStepDebugging(false);
    setIsAutoPlaying(false);
    setActiveDebugStepIndex(null);
    onLog('INFO', '[DEBUGGER] Debugger reset to start.', 'DEBUGGER');
  };

  // Auto-play stepping mode
  useEffect(() => {
    if (isAutoPlaying && isStepDebugging) {
      autoPlayTimerRef.current = setInterval(() => {
        handleStepNext();
      }, Math.max(250, speedSettings.executionSpeedMs * 15));
    } else {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isAutoPlaying, isStepDebugging, activeDebugStepIndex, sharedState]);

  const handleCopyPipeline = () => {
    const fullScript = steps
      .map((s) => `// --- Step ${s.stepNumber} [${s.language.toUpperCase()}] ---\n${s.code}`)
      .join('\n\n');
    navigator.clipboard.writeText(fullScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPipeline = () => {
    const fullScript = steps
      .map((s) => `// --- Step ${s.stepNumber} [${s.language.toUpperCase()}] ---\n${s.code}`)
      .join('\n\n');
    const blob = new Blob([fullScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline_${Date.now()}.macro`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3.5">
      {/* Title & Blocks Count Badge */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold tracking-wider text-slate-400 uppercase">
          Combined Multi-Language Pipeline
        </span>
        <span className="font-mono text-[11px] text-slate-300 px-2 py-0.5 rounded bg-[#181a25] border border-[#232736]">
          {steps.length} BLOCKS
        </span>
      </div>

      {/* Quick Action Syntax Injection Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
        <button
          onClick={() => handleInjectSnippet('tap')}
          className="flex-1 min-w-[62px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <span>⊞</span> +Tap
        </button>
        <button
          onClick={() => handleInjectSnippet('hold')}
          className="flex-1 min-w-[64px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <span>✋</span> +Hold
        </button>
        <button
          onClick={() => handleInjectSnippet('swipe')}
          className="flex-1 min-w-[68px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <span>✥</span> +Swipe
        </button>
        <button
          onClick={() => handleInjectSnippet('wait')}
          className="flex-1 min-w-[64px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <span>🕒</span> +Wait
        </button>
        <button
          onClick={() => handleInjectSnippet('loop')}
          className="flex-1 min-w-[64px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <span>🔄</span> +Loop
        </button>
        <button
          onClick={() => handleInjectSnippet('snapshot')}
          className="flex-1 min-w-[70px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-colors flex items-center justify-center gap-1 font-medium"
        >
          <Camera className="w-3.5 h-3.5" /> +Picture
        </button>
      </div>

      {/* Main Execution & Tool Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onExecute}
          disabled={isExecuting || isStepDebugging}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-2 transition-all ${
            isExecuting
              ? 'bg-emerald-500/50 text-white cursor-wait animate-pulse'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.99]'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isExecuting ? 'Executing Pipeline...' : 'Execute Pipeline'}
        </button>

        {/* Step-by-Step Debugger Button */}
        {!isStepDebugging ? (
          <button
            onClick={handleStartDebugging}
            className="py-2.5 px-3.5 rounded-xl bg-[#191d2c] hover:bg-[#23293e] text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            title="Launch Step-by-Step Visual Debugger"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Debug
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleStepNext}
              className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)] animate-pulse"
              title="Execute Next Block"
            >
              <SkipForward className="w-3.5 h-3.5 fill-current" />
              Step Next
            </button>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-2.5 rounded-xl border text-xs transition-colors ${
                isAutoPlaying
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                  : 'bg-[#151722] text-slate-300 border-[#232737]'
              }`}
              title={isAutoPlaying ? "Pause Auto-Step" : "Auto-Step"}
            >
              {isAutoPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleResetDebugger}
              className="p-2.5 rounded-xl bg-[#151722] hover:bg-[#1f2232] text-slate-400 hover:text-white border border-[#232737] text-xs transition-colors"
              title="Exit Debugger"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}

        <button
          onClick={onOpenPicker}
          className="py-2.5 px-3 rounded-xl bg-[#151722] hover:bg-[#1f2232] text-slate-200 border border-[#232737] text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
          Coords
        </button>

        <button
          onClick={() => setShowStateInspector(!showStateInspector)}
          title="sharedState Memory Inspector"
          className={`p-2.5 rounded-xl border text-xs transition-colors ${
            showStateInspector
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
              : 'bg-[#151722] hover:bg-[#1f2232] text-slate-300 border-[#232737]'
          }`}
        >
          <Eye className="w-4 h-4" />
        </button>

        {/* Actions & Tools Overlay Trigger Button */}
        <button
          onClick={() => setIsActionsOverlayOpen(true)}
          className="py-2.5 px-3 rounded-xl bg-[#181c2b] hover:bg-[#22273a] text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.15)] shrink-0 group active:scale-[0.98]"
          title="Open Pipeline Tools & Actions Overlay (Import, Export, Copy, Download, Reset)"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200 shrink-0" />
          <span>Tools</span>
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
        </button>
      </div>

      {/* STEP-BY-STEP VISUAL DEBUGGER OVERLAY & REAL-TIME sharedState HUD */}
      {showStateInspector && (
        <div className="bg-[#0e1017] border border-cyan-500/40 rounded-2xl p-3.5 space-y-2.5 text-xs font-mono shadow-[0_0_20px_rgba(6,182,212,0.15)] relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isStepDebugging ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-cyan-300 font-bold tracking-wide">
                REAL-TIME DEBUGGER & sharedState HUD
              </span>
            </div>

            {isStepDebugging && activeDebugStepIndex !== null && (
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 animate-pulse text-[10px]">
                PAUSED AT STEP #{activeDebugStepIndex + 1}
              </span>
            )}
          </div>

          <div className="text-[11px] text-slate-400 flex items-center justify-between border-b border-[#1a1e2d] pb-1.5">
            <span>Global Variables Synced Across Languages</span>
            <span className="text-slate-500">Delay: {speedSettings.executionSpeedMs}ms</span>
          </div>

          {Object.keys(sharedState).length === 0 ? (
            <div className="text-slate-500 text-[11px] italic py-1">
              sharedState is currently empty. Start debugging or run pipeline to populate values.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {Object.entries(sharedState).map(([k, v]) => {
                const isMutated = recentlyMutatedKeys.includes(k);
                return (
                  <div
                    key={k}
                    className={`p-2 rounded-lg border transition-all ${
                      isMutated
                        ? 'bg-cyan-500/25 border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                        : 'bg-[#141622] border-[#222638]'
                    }`}
                  >
                    <div className="text-slate-400 text-[10px] truncate">{k}</div>
                    <div className="text-emerald-400 font-bold truncate mt-0.5">
                      {JSON.stringify(v)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pipeline Steps List with Visual Execution Highlighting */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isActiveSelection = step.id === activeStepId;
          const isCurrentlyExecuting = activeDebugStepIndex === index;

          return (
            <div
              key={step.id}
              onClick={() => setActiveStepId(step.id)}
              className={`bg-[#12141c] rounded-xl overflow-hidden transition-all duration-300 ${
                isCurrentlyExecuting
                  ? 'border-2 border-cyan-400 ring-4 ring-cyan-400/30 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-[1.01]'
                  : isActiveSelection
                  ? 'border border-emerald-500/40 ring-1 ring-emerald-500/20'
                  : 'border border-[#1e2230]'
              }`}
            >
              {/* Step Header */}
              <div className={`p-3 border-b flex items-center justify-between gap-2 transition-colors ${
                isCurrentlyExecuting ? 'bg-[#132233] border-cyan-500/50' : 'bg-[#151824] border-[#1f2334]'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white flex items-center gap-1.5">
                    Step {step.stepNumber}
                    {isCurrentlyExecuting && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500 text-slate-950 animate-bounce">
                        EXECUTING
                      </span>
                    )}
                  </span>

                  {/* Language Selector Tabs */}
                  <div className="flex items-center gap-1 bg-[#0c0d13] p-0.5 rounded-lg border border-[#222536]">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang.key}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLanguageChange(step.id, lang.key);
                        }}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all ${
                          step.language === lang.key
                            ? 'bg-[#252a3d] text-white shadow-xs font-semibold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step Reorder & Delete Controls */}
                <div className="flex items-center gap-1 text-slate-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveStep(index, 'up');
                    }}
                    disabled={index === 0}
                    className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                    title="Move Step Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMoveStep(index, 'down');
                    }}
                    disabled={index === steps.length - 1}
                    className="p-1 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400"
                    title="Move Step Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStep(step.id);
                    }}
                    disabled={steps.length <= 1}
                    className="p-1 hover:text-red-400 disabled:opacity-30 disabled:hover:text-slate-400"
                    title="Delete Step"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subtitle / Metadata Bar */}
              <div className="px-3.5 py-1.5 bg-[#10121a] border-b border-[#1b1e2c] flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>sharedState: persist variables across pipeline steps</span>
                <span className="text-slate-400 font-semibold">{step.targetDesc}</span>
              </div>

              {/* Code Area */}
              <div className="p-3 bg-[#0a0b0f]">
                <textarea
                  value={step.code}
                  onChange={(e) => handleCodeChange(step.id, e.target.value)}
                  rows={4}
                  spellCheck={false}
                  className="w-full bg-transparent font-mono text-xs text-slate-200 resize-y focus:outline-none leading-relaxed selection:bg-emerald-500/30"
                  placeholder={`// Enter ${step.language.toUpperCase()} commands or use +Tap, +Wait buttons above...`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Pipeline Block Button */}
      <button
        onClick={handleAddStep}
        className="w-full py-3 rounded-xl border border-dashed border-[#2b3044] hover:border-emerald-500/40 bg-[#12141c]/60 hover:bg-[#161824] text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all group"
      >
        <Plus className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        + Add Pipeline Block
      </button>

      {/* Pipeline Actions & Tools Overlay Modal */}
      <EditorActionsOverlay
        isOpen={isActionsOverlayOpen}
        onClose={() => setIsActionsOverlayOpen(false)}
        isPipeline={true}
        onCopy={handleCopyPipeline}
        copied={copied}
        onDownload={handleExportPipeline}
        onOpenImport={onOpenImport}
        onOpenExport={onOpenExport}
        onOpenCoordsPicker={onOpenPicker}
      />
    </div>
  );
};
