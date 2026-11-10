import React from 'react';

interface MacroEngineCardProps {
  engineActive: boolean;
  onToggleEngine: () => void;
  multiLanguage: boolean;
  onToggleMultiLanguage: (val: boolean) => void;
}

export const MacroEngineCard: React.FC<MacroEngineCardProps> = ({
  engineActive,
  onToggleEngine,
  multiLanguage,
  onToggleMultiLanguage
}) => {
  return (
    <div className="space-y-4">
      {/* MACRO ENGINE STATUS CARD */}
      <div className="bg-[#12141c] border border-[#1e2230] rounded-xl p-3.5 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs font-bold tracking-wider text-slate-200">
            MACRO ENGINE
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Native Bridge Connected · JNI NDK Ready
          </div>
        </div>

        <button
          onClick={onToggleEngine}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
            engineActive
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              : 'bg-red-500/10 text-red-400 border border-red-500/40 hover:bg-red-500/20'
          }`}
        >
          {engineActive ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* LANGUAGE ENGINE CONFIG */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
          Language Engine
        </div>

        <div className="bg-[#12141c] border border-[#1e2230] rounded-xl p-3.5 flex items-center justify-between">
          <div className="pr-4">
            <div className="text-xs font-semibold text-slate-200">
              Multi-language code
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              {multiLanguage
                ? 'ON: Combined pipeline (Sequential execution with sharedState)'
                : 'OFF: Single engine · ON: Combined pipeline'}
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={multiLanguage}
            onClick={() => onToggleMultiLanguage(!multiLanguage)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
              multiLanguage ? 'bg-emerald-500' : 'bg-[#252837]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-y-0.5 ${
                multiLanguage ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
