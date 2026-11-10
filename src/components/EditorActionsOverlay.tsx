import React from 'react';
import {
  FileUp,
  Share2,
  Copy,
  Download,
  RotateCcw,
  Smartphone,
  Crosshair,
  Pipette,
  Check,
  X,
  Sparkles,
  SlidersHorizontal,
  Code2,
  Terminal,
  HelpCircle
} from 'lucide-react';
import { ScriptLanguage } from '../types/macro';

export interface EditorActionsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  language?: ScriptLanguage;
  onCopy: () => void;
  copied: boolean;
  onDownload: () => void;
  onReset?: () => void;
  onOpenImport?: () => void;
  onOpenExport?: () => void;
  onOpenCoordsPicker?: () => void;
  onOpenColorChecker?: () => void;
  onOpenCanvasSimulator?: () => void;
  onToggleFloatingHud?: () => void;
  isPipeline?: boolean;
}

export const EditorActionsOverlay: React.FC<EditorActionsOverlayProps> = ({
  isOpen,
  onClose,
  language = 'quickjs',
  onCopy,
  copied,
  onDownload,
  onReset,
  onOpenImport,
  onOpenExport,
  onOpenCoordsPicker,
  onOpenColorChecker,
  onOpenCanvasSimulator,
  onToggleFloatingHud,
  isPipeline = false
}) => {
  if (!isOpen) return null;

  const getLangExtension = (lang: ScriptLanguage) => {
    switch (lang) {
      case 'cpp': return '.cpp';
      case 'luau': return '.luau';
      case 'kt': return '.kt';
      case 'quickjs':
      case 'js': return '.js';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 pt-14 sm:pt-6 pb-8 overflow-y-auto bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-[#0e1017] border border-[#23283b] rounded-2xl shadow-[0_0_35px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[82dvh] sm:max-h-[85vh] shrink-0 mt-2 sm:my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1c2030] bg-[#121520] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">
                  {isPipeline ? 'Pipeline Tools & Actions' : 'Script Tools & Actions'}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 uppercase">
                  {isPipeline ? 'Multi-Lang' : language.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Quick access to all macro utilities and file operations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#181b28] hover:bg-[#22273a] text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-[#23283b] shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Section: File & Routine Management */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              File Operations & Sharing
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Import Code Button */}
              {onOpenImport && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenImport();
                  }}
                  className="p-3 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-emerald-500/30 hover:border-emerald-500/60 text-left transition-all group flex flex-col justify-between min-h-[72px]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      <FileUp className="w-4 h-4 text-emerald-400" />
                      Import Code
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/40">
                      FILE / PASTE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Load C++, Luau, QJS, JS, KT or JSON
                  </p>
                </button>
              )}

              {/* Export / Share Button */}
              {onOpenExport && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenExport();
                  }}
                  className="p-3 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-cyan-500/30 hover:border-cyan-500/60 text-left transition-all group flex flex-col justify-between min-h-[72px]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      Export Routine
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                      MULTI-LANG
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Export to all 6 formats or JSON
                  </p>
                </button>
              )}

              {/* Copy Script */}
              <button
                onClick={onCopy}
                className="p-3 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-[#23283b] hover:border-slate-500 text-left transition-all group flex flex-col justify-between min-h-[72px]"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-300" />
                    )}
                    {copied ? 'Copied Buffer!' : 'Copy Script'}
                  </span>
                  {copied && (
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                      READY
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Copy editor text to clipboard
                </p>
              </button>

              {/* Download File */}
              <button
                onClick={() => {
                  onDownload();
                  onClose();
                }}
                className="p-3 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-[#23283b] hover:border-slate-500 text-left transition-all group flex flex-col justify-between min-h-[72px]"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-slate-300" />
                    Download File
                  </span>
                  <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#1c2030] text-slate-300">
                    {isPipeline ? '.macro' : getLangExtension(language)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Save routine to local storage
                </p>
              </button>
            </div>
          </div>

          {/* Section: Screen & Detection Tools */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Screen Sensors & Calibration Tools
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Coords Picker */}
              {onOpenCoordsPicker && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCoordsPicker();
                  }}
                  className="p-3 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-cyan-500/30 text-left transition-all group flex flex-col justify-between min-h-[72px]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-cyan-300 group-hover:text-cyan-200 flex items-center gap-1.5">
                      <Crosshair className="w-4 h-4 text-cyan-400" />
                      Coordinate Picker
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-950/80 text-cyan-300">
                      CALIBRATED
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Full crosshair with DPI scaling & nudge
                  </p>
                </button>
              )}

              {/* Pixel Color Checker */}
              {onOpenColorChecker && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenColorChecker();
                  }}
                  className="p-3 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-pink-500/30 text-left transition-all group flex flex-col justify-between min-h-[72px]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-pink-300 group-hover:text-pink-200 flex items-center gap-1.5">
                      <Pipette className="w-4 h-4 text-pink-400" />
                      Pixel Color Loupe
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-pink-950/80 text-pink-300">
                      12× LOUPE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Above-thumb floating color sampler
                  </p>
                </button>
              )}

              {/* Canvas Simulator */}
              {onOpenCanvasSimulator && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenCanvasSimulator();
                  }}
                  className="p-3 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-amber-500/30 text-left transition-all group flex flex-col justify-between min-h-[72px]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-amber-300 group-hover:text-amber-200 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-400" />
                      Canvas Simulator
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-950/80 text-amber-300">
                      TOUCH SIM
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Interactive mobile screen sandbox
                  </p>
                </button>
              )}

              {/* Reset Template */}
              {onReset && (
                <button
                  onClick={() => {
                    onReset();
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-rose-500/30 text-left transition-all group flex flex-col justify-between min-h-[72px]"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-rose-300 group-hover:text-rose-200 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4 text-rose-400" />
                      Reset Code
                    </span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-rose-950/80 text-rose-300">
                      RESTORE
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Restore clean engine boilerplate
                  </p>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1c2030] bg-[#10121c] flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[11px] text-slate-300">
              MacroExecutor Runtime Ready
            </span>
          </div>
          <button
            onClick={onClose}
            className="py-1.5 px-3 rounded-lg bg-[#1c2030] hover:bg-[#282d44] text-slate-200 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
