import React from 'react';

interface FooterBarProps {
  engineActive: boolean;
  multiLanguage: boolean;
  blockCount: number;
  singleEngineName: string;
  executionSpeedMs: number;
}

export const FooterBar: React.FC<FooterBarProps> = ({
  engineActive,
  multiLanguage,
  blockCount,
  singleEngineName,
  executionSpeedMs
}) => {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 bg-[#0a0b0e]/95 backdrop-blur-md border-t border-[#181a24] px-4 py-2 flex items-center justify-between text-[11px] text-slate-400 font-mono select-none">
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500 font-semibold">v1.0</span>
        <span className="text-slate-700">·</span>
        <span className="text-emerald-400 font-bold">{executionSpeedMs}ms delay</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Engine</span>
          <span className="text-slate-600">|</span>
          <span className={`font-semibold ${engineActive ? 'text-emerald-400' : 'text-red-400'}`}>
            {engineActive ? 'ON' : 'OFF'}
          </span>
        </div>

        <span className="text-slate-700">·</span>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Mode</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-200 font-medium">
            {multiLanguage ? `Multi (${blockCount} Blocks)` : `Single (${singleEngineName})`}
          </span>
        </div>
      </div>
    </footer>
  );
};
