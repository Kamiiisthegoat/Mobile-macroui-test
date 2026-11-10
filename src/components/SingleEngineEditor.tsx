import React, { useState } from 'react';
import { ScriptLanguage } from '../types/macro';
import { SINGLE_ENGINE_TEMPLATES } from '../data/defaultConfigs';
import { generateSnippet } from '../engine/pipelineEngine';
import { Play, Crosshair, Pipette, Copy, Download, RotateCcw, Smartphone, Check, Layers, Camera, Share2, FileUp, SlidersHorizontal } from 'lucide-react';
import { EditorActionsOverlay } from './EditorActionsOverlay';

interface SingleEngineEditorProps {
  selectedLanguage: ScriptLanguage;
  onSelectLanguage: (lang: ScriptLanguage) => void;
  code: string;
  onChangeCode: (newCode: string) => void;
  onExecute: () => void;
  onOpenCoordsPicker: () => void;
  onOpenColorChecker: () => void;
  onOpenCanvasSimulator: () => void;
  onToggleFloatingHud: () => void;
  isExecuting: boolean;
  showToastOnTrigger: boolean;
  onToggleToast: (val: boolean) => void;
  menuSize: number;
  onChangeMenuSize: (val: number) => void;
  onOpenExport?: () => void;
  onOpenImport?: () => void;
}

const LANGUAGES: Array<{ key: ScriptLanguage; label: string }> = [
  { key: 'js', label: 'JS' },
  { key: 'quickjs', label: 'QJS' },
  { key: 'luau', label: 'Luau' },
  { key: 'kt', label: 'KT' },
  { key: 'cpp', label: 'C++' }
];

export const SingleEngineEditor: React.FC<SingleEngineEditorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  code,
  onChangeCode,
  onExecute,
  onOpenCoordsPicker,
  onOpenColorChecker,
  onOpenCanvasSimulator,
  onToggleFloatingHud,
  isExecuting,
  showToastOnTrigger,
  onToggleToast,
  menuSize,
  onChangeMenuSize,
  onOpenExport,
  onOpenImport
}) => {
  const [copied, setCopied] = useState(false);
  const [isActionsOverlayOpen, setIsActionsOverlayOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([code]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const getExtension = (lang: ScriptLanguage) => {
    switch (lang) {
      case 'cpp': return 'ROUTINE.CPP';
      case 'luau': return 'ROUTINE.LUAU';
      case 'kt': return 'ROUTINE.KT';
      case 'quickjs': return 'ROUTINE.JS';
      case 'js': return 'ROUTINE.JS';
    }
  };

  const handleInject = (action: 'tap' | 'hold' | 'swipe' | 'wait' | 'loop' | 'snapshot') => {
    const snippet = generateSnippet(action, selectedLanguage);
    onChangeCode(code ? `${code}\n${snippet}` : snippet);
  };

  const handleReset = () => {
    onChangeCode(SINGLE_ENGINE_TEMPLATES[selectedLanguage]);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = getExtension(selectedLanguage).toLowerCase();
    a.click();
    URL.revokeObjectURL(url);
  };

  const zoomScale = menuSize / 100;

  return (
    <div
      className="space-y-4 transition-all duration-150"
      style={{
        transform: `scale(${zoomScale})`,
        transformOrigin: 'top center',
        marginBottom: `${(zoomScale - 1) * 300}px`
      }}
    >
      {/* Engine Selection Bar */}
      <div className="flex items-center gap-1.5 bg-[#12141c] p-1.5 rounded-xl border border-[#1e2230]">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.key}
            onClick={() => {
              onSelectLanguage(lang.key);
              onChangeCode(SINGLE_ENGINE_TEMPLATES[lang.key]);
            }}
            className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-mono font-medium transition-all ${
              selectedLanguage === lang.key
                ? 'bg-[#222738] text-white shadow-sm border border-[#31384f] font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Active Target Banner */}
      <div className="bg-[#12141c] border border-[#1e2230] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Active Target</span>
        <span className="font-mono font-bold text-slate-100 tracking-wider">
          {selectedLanguage === 'quickjs' ? 'QUICKJS' : selectedLanguage.toUpperCase()}
        </span>
      </div>

      {/* SCRIPT & ACTIONS HEADER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold tracking-wider text-slate-400 uppercase">
            Script & Actions
          </span>
          <span className="font-mono text-[11px] text-slate-400 font-semibold">
            {getExtension(selectedLanguage)}
          </span>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
          <button
            onClick={() => handleInject('tap')}
            className="flex-1 min-w-[62px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
          >
            <span>⊞</span> +Tap
          </button>
          <button
            onClick={() => handleInject('hold')}
            className="flex-1 min-w-[64px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
          >
            <span>✋</span> +Hold
          </button>
          <button
            onClick={() => handleInject('swipe')}
            className="flex-1 min-w-[68px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
          >
            <span>✥</span> +Swipe
          </button>
          <button
            onClick={() => handleInject('wait')}
            className="flex-1 min-w-[64px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
          >
            <span>🕒</span> +Wait
          </button>
          <button
            onClick={() => handleInject('loop')}
            className="flex-1 min-w-[64px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-slate-300 hover:text-white border border-[#212433] transition-colors flex items-center justify-center gap-1.5 font-medium"
          >
            <span>🔄</span> +Loop
          </button>
          <button
            onClick={() => handleInject('snapshot')}
            className="flex-1 min-w-[70px] py-2 px-2 rounded-lg bg-[#141620] hover:bg-[#1e2230] text-amber-300 hover:text-amber-200 border border-amber-500/30 transition-colors flex items-center justify-center gap-1 font-medium"
          >
            <Camera className="w-3.5 h-3.5" /> +Picture
          </button>
        </div>

        {/* Action Row with Clean Scaling & Overflow Prevention */}
        <div className="flex items-center gap-1.5 w-full">
          <button
            onClick={onExecute}
            disabled={isExecuting}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs tracking-wide flex items-center justify-center gap-1.5 transition-all truncate min-w-[90px] ${
              isExecuting
                ? 'bg-emerald-500/50 text-white cursor-wait animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] active:scale-[0.99]'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current shrink-0" />
            <span className="truncate">{isExecuting ? 'Executing...' : 'Execute'}</span>
          </button>

          {/* Coordinate Picker Tool */}
          <button
            onClick={onOpenCoordsPicker}
            className="py-2.5 px-2.5 sm:px-3 rounded-xl bg-[#151722] hover:bg-[#1f2232] text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            title="Coordinate Picker (Auto-Scaling)"
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Coords</span>
          </button>

          {/* Pixel Color Checker Tool */}
          <button
            onClick={onOpenColorChecker}
            className="py-2.5 px-2.5 sm:px-3 rounded-xl bg-[#151722] hover:bg-[#1f2232] text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            title="Pixel Color Checker (12x Loupe)"
          >
            <Pipette className="w-3.5 h-3.5 text-pink-400 shrink-0" />
            <span>Color</span>
          </button>

          {/* All Actions & Tools Overlay Trigger Button */}
          <button
            onClick={() => setIsActionsOverlayOpen(true)}
            className="py-2.5 px-2.5 sm:px-3 rounded-xl bg-[#181c2b] hover:bg-[#22273a] text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.15)] shrink-0 group active:scale-[0.98]"
            title="Open Script Actions & Tools Overlay (Import, Export, Copy, Download, Canvas, Reset)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200 shrink-0" />
            <span>Tools</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          </button>
        </div>

        {/* Code Editor */}
        <div className="bg-[#0b0c10] border border-[#1e2230] rounded-xl p-3.5">
          <textarea
            value={code}
            onChange={(e) => onChangeCode(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full bg-transparent font-mono text-xs text-slate-200 resize-y focus:outline-none leading-relaxed selection:bg-emerald-500/30"
          />
        </div>
      </div>

      {/* STATUS / DETECTION */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Status / Detection
        </div>
        <div className="bg-[#12141c] border border-amber-500/30 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
          <span className="text-amber-400 font-semibold">
            Ready: Native AccessibilityService Bound
          </span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
        </div>
      </div>

      {/* WINDOW & OVERLAY: ACTIVE MENU SIZE SCALING */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Window & Overlay (Active Scaling)
        </div>

        <div className="bg-[#12141c] border border-[#1e2230] rounded-xl p-3.5 space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-200">
              Show status toast on trigger
            </span>
            <button
              type="button"
              role="switch"
              aria-label="Show status toast on trigger"
              aria-checked={showToastOnTrigger}
              onClick={() => onToggleToast(!showToastOnTrigger)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                showToastOnTrigger ? 'bg-emerald-500' : 'bg-[#252837]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-y-0.5 ${
                  showToastOnTrigger ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {/* Menu Size Slider with Immediate Visual Scaling */}
          <div className="pt-2 border-t border-[#1a1c28]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <div>
                <span className="text-slate-300 font-medium">Menu size</span>
                <span className="text-[10px] text-cyan-400 block mt-0.5">Scales entire editor & menu zoom</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#1a1c27] text-cyan-300 font-bold border border-[#262a3a]">
                  {menuSize}%
                </span>
                <button
                  onClick={() => onChangeMenuSize(100)}
                  className="text-[10px] text-slate-400 hover:text-white ml-1 underline"
                >
                  Reset
                </button>
              </div>
            </div>
            <input
              type="range"
              min="70"
              max="130"
              step="5"
              value={menuSize}
              onChange={(e) => onChangeMenuSize(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-[#252837] rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="pt-2 border-t border-[#1a1c28]">
            <button
              onClick={onToggleFloatingHud}
              className="w-full py-2.5 rounded-lg bg-[#181b28] hover:bg-[#202436] text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Layers className="w-4 h-4" />
              Toggle Floating HUD Overlay (SYSTEM_ALERT_WINDOW)
            </button>
          </div>
        </div>
      </div>

      {/* Script Actions & Tools Overlay Modal */}
      <EditorActionsOverlay
        isOpen={isActionsOverlayOpen}
        onClose={() => setIsActionsOverlayOpen(false)}
        language={selectedLanguage}
        onCopy={handleCopy}
        copied={copied}
        onDownload={handleDownload}
        onReset={handleReset}
        onOpenImport={onOpenImport}
        onOpenExport={onOpenExport}
        onOpenCoordsPicker={onOpenCoordsPicker}
        onOpenColorChecker={onOpenColorChecker}
        onOpenCanvasSimulator={onOpenCanvasSimulator}
        onToggleFloatingHud={onToggleFloatingHud}
      />
    </div>
  );
};

