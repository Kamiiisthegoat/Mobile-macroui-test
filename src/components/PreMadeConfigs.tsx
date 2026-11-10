import React, { useState, useMemo } from 'react';
import { MacroConfig } from '../types/macro';
import { Crosshair, Pipette, Play, Code2, Copy, Check, ArrowRight, Share2, FileUp, FileDown, Search, CopyPlus } from 'lucide-react';

interface PreMadeConfigsProps {
  configs: MacroConfig[];
  onUpdateConfig: (config: MacroConfig) => void;
  onLoadIntoEditor: (config: MacroConfig) => void;
  onExecuteConfig: (config: MacroConfig) => void;
  onOpenCoordsPickerForTarget: (configId: string, targetType: 'soru' | 'portal') => void;
  onOpenColorCheckerForTarget: (configId: string, targetType: 'soru' | 'portal') => void;
  onOpenExportForMacro?: (macro: MacroConfig) => void;
  onOpenImport?: () => void;
  onDuplicateConfig?: (macro: MacroConfig) => void;
}

export const PreMadeConfigs: React.FC<PreMadeConfigsProps> = ({
  configs,
  onUpdateConfig,
  onLoadIntoEditor,
  onExecuteConfig,
  onOpenCoordsPickerForTarget,
  onOpenColorCheckerForTarget,
  onOpenExportForMacro,
  onOpenImport,
  onDuplicateConfig
}) => {
  const [selectedCodeConfig, setSelectedCodeConfig] = useState<MacroConfig | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) return configs;
    const q = searchQuery.toLowerCase();
    return configs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.engine.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [configs, searchQuery]);

  const handleCopy = (config: MacroConfig) => {
    navigator.clipboard.writeText(config.code);
    setCopiedId(config.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner with Import/Export Quick Actions */}
      <div className="bg-[#12141c] border border-[#1e2230] rounded-xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider text-slate-100">
            PRE-MADE ROUTINES & TEMPLATES
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
            CALIBRATED
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Pre-tuned game macros (Soru_X Macro), coordinate sensors, and hardware routines for Android JNI and AccessibilityService.
        </p>

        {/* Quick Import / Export Buttons */}
        <div className="flex items-center gap-2 pt-1 border-t border-[#1b1f2d]">
          {onOpenImport && (
            <button
              onClick={onOpenImport}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileUp className="w-3.5 h-3.5" />
              Import Routine File (Any Language)
            </button>
          )}

          {onOpenExportForMacro && (
            <button
              onClick={() => configs[0] && onOpenExportForMacro(configs[0])}
              className="py-1.5 px-3 rounded-lg bg-[#181a26] hover:bg-[#202335] text-slate-200 border border-[#272b3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <FileDown className="w-3.5 h-3.5 text-cyan-400" />
              Export Configs
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Bar (QoL) */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search pre-mades (Soru X, QuickJS, Luau, C++)..."
          className="w-full bg-[#12141c] border border-[#202536] rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase">
        <span>Configurable Pre-Mades ({filteredConfigs.length})</span>
        {searchQuery && (
          <span className="text-cyan-400 lowercase font-normal">
            matching "{searchQuery}"
          </span>
        )}
      </div>

      {/* Cards List */}
      <div className="space-y-4">
        {filteredConfigs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500 bg-[#12141c] border border-[#1e2230] rounded-xl p-4">
            No macro routines match your search query "{searchQuery}".
          </div>
        ) : (
          filteredConfigs.map((config) => (
            <div
              key={config.id}
              className="bg-[#12141c] border border-[#1e2230] rounded-xl p-4 space-y-3.5"
            >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-slate-100 tracking-wide">
                  {config.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {config.engine}
                </p>
              </div>

              <button
                onClick={() => onLoadIntoEditor(config)}
                className="px-3 py-1.5 rounded-lg bg-[#1a1d2a] hover:bg-[#232738] text-slate-200 border border-[#2b3044] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                Load Config
              </button>
            </div>

            {/* Soru Coordinates Trigger Target */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Soru Coordinates</span>
                <span className="text-[10px] text-slate-400">Trigger Target</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-[#0d0e14] border border-[#202332] rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 font-mono text-xs mr-2">X:</span>
                  <input
                    type="number"
                    value={config.soruCoords.x}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        soruCoords: { ...config.soruCoords, x: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-transparent font-mono text-xs font-bold text-slate-100 focus:outline-none"
                  />
                  <span className="text-slate-500 font-mono text-xs ml-1">×</span>
                </div>

                <div className="flex items-center bg-[#0d0e14] border border-[#202332] rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 font-mono text-xs mr-2">Y:</span>
                  <input
                    type="number"
                    value={config.soruCoords.y}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        soruCoords: { ...config.soruCoords, y: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-transparent font-mono text-xs font-bold text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Portal Coordinates Secondary Target */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Portal Coordinates</span>
                <span className="text-[10px] text-slate-400">Secondary Target</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center bg-[#0d0e14] border border-[#202332] rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 font-mono text-xs mr-2">X:</span>
                  <input
                    type="number"
                    value={config.portalCoords.x}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        portalCoords: { ...config.portalCoords, x: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-transparent font-mono text-xs font-bold text-slate-100 focus:outline-none"
                  />
                  <span className="text-slate-500 font-mono text-xs ml-1">×</span>
                </div>

                <div className="flex items-center bg-[#0d0e14] border border-[#202332] rounded-lg px-2.5 py-1.5">
                  <span className="text-slate-400 font-mono text-xs mr-2">Y:</span>
                  <input
                    type="number"
                    value={config.portalCoords.y}
                    onChange={(e) =>
                      onUpdateConfig({
                        ...config,
                        portalCoords: { ...config.portalCoords, y: Number(e.target.value) }
                      })
                    }
                    className="w-full bg-transparent font-mono text-xs font-bold text-slate-100 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Color Detection Inputs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-[#0d0e14] border border-[#202332] rounded-lg px-3 py-2">
                <span className="text-xs text-slate-300">Soru Color</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-sm border border-white/20 shadow-xs"
                    style={{ backgroundColor: config.soruColor }}
                  />
                  <input
                    type="text"
                    value={config.soruColor}
                    onChange={(e) => onUpdateConfig({ ...config, soruColor: e.target.value })}
                    className="w-24 font-mono text-xs text-right bg-transparent text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between bg-[#0d0e14] border border-[#202332] rounded-lg px-3 py-2">
                <span className="text-xs text-slate-300">Portal Color</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-sm border border-white/20 shadow-xs"
                    style={{ backgroundColor: config.portalColor }}
                  />
                  <input
                    type="text"
                    value={config.portalColor}
                    onChange={(e) => onUpdateConfig({ ...config, portalColor: e.target.value })}
                    className="w-24 font-mono text-xs text-right bg-transparent text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Separate Tools Actions */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onOpenCoordsPickerForTarget(config.id, 'soru')}
                className="py-2.5 px-2 rounded-lg bg-[#161824] hover:bg-[#1f2233] text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                Pick Coordinates
              </button>

              <button
                onClick={() => onOpenColorCheckerForTarget(config.id, 'soru')}
                className="py-2.5 px-2 rounded-lg bg-[#161824] hover:bg-[#1f2233] text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Pipette className="w-3.5 h-3.5 text-pink-400" />
                Check Pixel Color
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-[#1a1c28]">
              <button
                onClick={() => onExecuteConfig(config)}
                className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(16,185,129,0.25)]"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Run Script
              </button>

              <button
                onClick={() => setSelectedCodeConfig(config)}
                className="py-2 px-3 rounded-lg bg-[#181a26] hover:bg-[#202335] text-slate-200 border border-[#272b3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Code2 className="w-3.5 h-3.5" />
                Code
              </button>

              <button
                onClick={() => handleCopy(config)}
                className="py-2 px-3 rounded-lg bg-[#181a26] hover:bg-[#202335] text-slate-200 border border-[#272b3d] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Copy code"
              >
                {copiedId === config.id ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                Copy
              </button>

              {onDuplicateConfig && (
                <button
                  onClick={() => onDuplicateConfig(config)}
                  className="py-2 px-3 rounded-lg bg-[#181a26] hover:bg-[#202335] text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Clone / Duplicate Routine"
                >
                  <CopyPlus className="w-3.5 h-3.5 text-amber-400" />
                  Clone
                </button>
              )}

              {onOpenExportForMacro && (
                <button
                  onClick={() => onOpenExportForMacro(config)}
                  className="py-2 px-3 rounded-lg bg-[#181a26] hover:bg-[#202335] text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Export / Share Routine (C++, Luau, QJS, JS, KT, JSON)"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                  Share
                </button>
              )}
            </div>
          </div>
        )))}
      </div>

      {/* Code Modal */}
      {selectedCodeConfig && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12141c] border border-[#222638] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-[#1e2232] flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-white">
                  {selectedCodeConfig.name} - Source Routine
                </h4>
                <p className="text-xs text-slate-400">{selectedCodeConfig.engine}</p>
              </div>
              <button
                onClick={() => setSelectedCodeConfig(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-[#0a0b0f] overflow-y-auto flex-1 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre">
              {selectedCodeConfig.code}
            </div>

            <div className="p-3 border-t border-[#1e2232] bg-[#141622] flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  onLoadIntoEditor(selectedCodeConfig);
                  setSelectedCodeConfig(null);
                }}
                className="py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                Load into Editor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
