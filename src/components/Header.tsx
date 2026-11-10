import React, { useState } from 'react';
import { ShieldCheck, Crosshair, Pipette, Layers, Code, Zap, Share2, Activity, SlidersHorizontal } from 'lucide-react';
import { GlobalToolsOverlay } from './GlobalToolsOverlay';

interface HeaderProps {
  activeTab: 'home' | 'templates' | 'recorder' | 'metrics';
  onTabChange: (tab: 'home' | 'templates' | 'recorder' | 'metrics') => void;
  onOpenCoordsPicker: () => void;
  onOpenColorChecker: () => void;
  onToggleFloatingHud: () => void;
  onOpenArchitecture: () => void;
  onOpenAccessibility: () => void;
  onOpenExportImport: (tab?: 'export' | 'import' | 'presets') => void;
  isHudOpen: boolean;
  engineActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onOpenCoordsPicker,
  onOpenColorChecker,
  onToggleFloatingHud,
  onOpenArchitecture,
  onOpenAccessibility,
  onOpenExportImport,
  isHudOpen,
  engineActive
}) => {
  const [isToolsOverlayOpen, setIsToolsOverlayOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0e0f14]/95 backdrop-blur-md border-b border-[#1c1e28] px-3.5 sm:px-4 py-2.5 sm:py-3">
      {/* Top Branding Row with Guaranteed Overflow Prevention */}
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 shrink-0">
            MacroExecutor
          </h1>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            NATIVE
          </span>
        </div>

        {/* Global Action Tools Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick Accessibility Status Badge */}
          <button
            onClick={onOpenAccessibility}
            title="Accessibility Service & Permissions"
            className="p-1.5 sm:p-2 rounded-xl text-slate-300 hover:text-white bg-[#141622] hover:bg-[#1d2132] border border-[#23273a] transition-colors relative"
            aria-label="System Permissions"
          >
            <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </button>

          {/* Tools & Utilities Overlay Trigger Button */}
          <button
            onClick={() => setIsToolsOverlayOpen(true)}
            className="py-1.5 px-2.5 sm:px-3 rounded-xl bg-[#161a28] hover:bg-[#20263b] text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] active:scale-95 group shrink-0"
            title="Open Global Tools & Utilities (Export, Import, Coords, Color, HUD, Architecture)"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400 group-hover:rotate-90 transition-transform duration-200 shrink-0" />
            <span>Tools</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          </button>
        </div>
      </div>

      {/* Global Tools & System Utilities Overlay */}
      <GlobalToolsOverlay
        isOpen={isToolsOverlayOpen}
        onClose={() => setIsToolsOverlayOpen(false)}
        onOpenExportImport={onOpenExportImport}
        onOpenAccessibility={onOpenAccessibility}
        onOpenCoordsPicker={onOpenCoordsPicker}
        onOpenColorChecker={onOpenColorChecker}
        onToggleFloatingHud={onToggleFloatingHud}
        onOpenArchitecture={onOpenArchitecture}
        isHudOpen={isHudOpen}
        engineActive={engineActive}
      />

      {/* Main Navigation Tabs (OpenCV removed per prompt) */}
      <nav className="flex items-center gap-1 mt-3 p-1 bg-[#12141c] rounded-xl border border-[#1e212d] overflow-x-auto text-xs font-medium">
        <button
          onClick={() => onTabChange('home')}
          className={`flex-1 min-w-[70px] py-2 px-3 rounded-lg font-medium transition-all text-center whitespace-nowrap ${
            activeTab === 'home'
              ? 'bg-[#1e2230] text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Home
        </button>

        <button
          onClick={() => onTabChange('templates')}
          className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg font-medium transition-all text-center whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-[#1e2230] text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Templates
        </button>

        <button
          onClick={() => onTabChange('recorder')}
          className={`flex-1 min-w-[85px] py-2 px-3 rounded-lg font-medium transition-all text-center whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'recorder'
              ? 'bg-[#1e2230] text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Recorder
        </button>

        <button
          onClick={() => onTabChange('metrics')}
          className={`flex-1 min-w-[80px] py-2 px-3 rounded-lg font-medium transition-all text-center whitespace-nowrap flex items-center justify-center gap-1.5 ${
            activeTab === 'metrics'
              ? 'bg-[#1e2230] text-cyan-300 shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          Metrics
        </button>
      </nav>
    </header>
  );
};
