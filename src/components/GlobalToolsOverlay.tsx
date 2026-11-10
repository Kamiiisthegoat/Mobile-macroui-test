import React, { useState, useMemo } from 'react';
import {
  Share2,
  ShieldCheck,
  Crosshair,
  Pipette,
  Layers,
  Code,
  X,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  Zap,
  Cpu,
  Activity,
  Play,
  Square,
  Search,
  Smartphone,
  Clock,
  Terminal,
  FileCode2,
  Flame,
  LayoutGrid,
  List,
  ChevronRight
} from 'lucide-react';

export interface GlobalToolsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExportImport: (tab?: 'export' | 'import' | 'presets') => void;
  onOpenAccessibility: () => void;
  onOpenCoordsPicker: () => void;
  onOpenColorChecker: () => void;
  onToggleFloatingHud: () => void;
  onOpenArchitecture: () => void;
  onTabChange?: (tab: 'home' | 'templates' | 'recorder' | 'metrics') => void;
  onToggleEngine?: () => void;
  activeTab?: 'home' | 'templates' | 'recorder' | 'metrics';
  isHudOpen: boolean;
  engineActive: boolean;
}

type ToolCategory = 'all' | 'sensors' | 'engine' | 'code' | 'system';

interface ToolItem {
  id: string;
  name: string;
  category: ToolCategory;
  categoryLabel: string;
  badge: string;
  badgeColor: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  actionText: string;
  onAction: () => void;
}

export const GlobalToolsOverlay: React.FC<GlobalToolsOverlayProps> = ({
  isOpen,
  onClose,
  onOpenExportImport,
  onOpenAccessibility,
  onOpenCoordsPicker,
  onOpenColorChecker,
  onToggleFloatingHud,
  onOpenArchitecture,
  onTabChange,
  onToggleEngine,
  activeTab = 'home',
  isHudOpen,
  engineActive
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  if (!isOpen) return null;

  // Complete registry of 12+ tools & utilities
  const allTools: ToolItem[] = [
    {
      id: 'tool-coords',
      name: 'Coordinate Picker',
      category: 'sensors',
      categoryLabel: 'SENSORS',
      badge: 'DPI CALIBRATED',
      badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-800/40',
      description: 'Interactive screen crosshair with DPI resolution gate & micro-nudge D-pad',
      icon: <Crosshair className="w-4 h-4 text-cyan-400" />,
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
      actionText: 'Launch Picker',
      onAction: () => {
        onClose();
        onOpenCoordsPicker();
      }
    },
    {
      id: 'tool-color',
      name: 'Pixel Color Checker',
      category: 'sensors',
      categoryLabel: 'SENSORS',
      badge: '12× LOUPE',
      badgeColor: 'text-pink-300 bg-pink-950/80 border-pink-800/40',
      description: 'Above-thumb floating 12× magnifier HUD with discrete hex color sampler',
      icon: <Pipette className="w-4 h-4 text-pink-400" />,
      iconBg: 'bg-pink-500/15 border-pink-500/30',
      actionText: 'Check Pixels',
      onAction: () => {
        onClose();
        onOpenColorChecker();
      }
    },
    {
      id: 'tool-hud',
      name: 'Floating HUD Window',
      category: 'engine',
      categoryLabel: 'ENGINE & HUD',
      badge: isHudOpen ? 'ACTIVE' : 'STANDBY',
      badgeColor: isHudOpen
        ? 'text-emerald-300 bg-emerald-950/80 border-emerald-700/50'
        : 'text-slate-400 bg-slate-800/50 border-slate-700/40',
      description: 'Draggable system overlay widget with quick Run, Coords, Color & Record triggers',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      actionText: isHudOpen ? 'Hide HUD' : 'Launch HUD',
      onAction: () => {
        onToggleFloatingHud();
        onClose();
      }
    },
    {
      id: 'tool-export-import',
      name: 'Export & Import Routines',
      category: 'code',
      categoryLabel: 'ROUTINES',
      badge: 'ALL LANGUAGES',
      badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-800/40',
      description: 'Import & export C++, Luau, QuickJS, JS, Kotlin, and JSON macro files',
      icon: <Share2 className="w-4 h-4 text-emerald-400" />,
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      actionText: 'Open Exporter',
      onAction: () => {
        onClose();
        onOpenExportImport('export');
      }
    },
    {
      id: 'tool-metrics',
      name: 'Performance & Metrics',
      category: 'system',
      categoryLabel: 'ANALYTICS',
      badge: 'LATENCY CHARTS',
      badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-800/40',
      description: 'Benchmark success rates, per-block latency ms, and CPU/memory overhead charts',
      icon: <Activity className="w-4 h-4 text-cyan-400" />,
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
      actionText: 'View Metrics',
      onAction: () => {
        onClose();
        if (onTabChange) onTabChange('metrics');
      }
    },
    {
      id: 'tool-recorder',
      name: 'Gesture Recorder',
      category: 'sensors',
      categoryLabel: 'RECORDER',
      badge: 'LIVE TOUCH',
      badgeColor: 'text-amber-300 bg-amber-950/80 border-amber-800/40',
      description: 'Record multi-touch taps, drags & hold intervals directly into script routines',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      actionText: 'Open Recorder',
      onAction: () => {
        onClose();
        if (onTabChange) onTabChange('recorder');
      }
    },
    {
      id: 'tool-templates',
      name: 'Soru X Macro Templates',
      category: 'code',
      categoryLabel: 'TEMPLATES',
      badge: 'SORU X READY',
      badgeColor: 'text-indigo-300 bg-indigo-950/80 border-indigo-800/40',
      description: 'Pre-tuned Blox Fruits Soru X routine, coordinate sensors, and auto-chain triggers',
      icon: <Flame className="w-4 h-4 text-indigo-400" />,
      iconBg: 'bg-indigo-500/15 border-indigo-500/30',
      actionText: 'Browse Templates',
      onAction: () => {
        onClose();
        if (onTabChange) onTabChange('templates');
      }
    },
    {
      id: 'tool-architecture',
      name: 'Android NDK Architecture',
      category: 'system',
      categoryLabel: 'NDK DRIVERS',
      badge: 'JNI C++',
      badgeColor: 'text-cyan-300 bg-cyan-950/80 border-cyan-800/40',
      description: 'Inspect native JNI C++ headers, CMakeLists, and evdev device injection bridge',
      icon: <Code className="w-4 h-4 text-cyan-400" />,
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
      actionText: 'View Architecture',
      onAction: () => {
        onClose();
        onOpenArchitecture();
      }
    },
    {
      id: 'tool-accessibility',
      name: 'Android Permissions & Diagnostics',
      category: 'system',
      categoryLabel: 'PERMISSIONS',
      badge: 'ACCESSIBILITY',
      badgeColor: 'text-emerald-300 bg-emerald-950/80 border-emerald-800/40',
      description: 'Verify BIND_ACCESSIBILITY_SERVICE status, touch injection & overlay diagnostics',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      actionText: 'View Diagnostics',
      onAction: () => {
        onClose();
        onOpenAccessibility();
      }
    },
    {
      id: 'tool-presets',
      name: 'Curated Routine Presets',
      category: 'code',
      categoryLabel: 'PRESETS',
      badge: 'COMMUNITY',
      badgeColor: 'text-teal-300 bg-teal-950/80 border-teal-800/40',
      description: 'Instant zero-delay flash-step and high-speed multi-language combat packages',
      icon: <Sparkles className="w-4 h-4 text-teal-400" />,
      iconBg: 'bg-teal-500/15 border-teal-500/30',
      actionText: 'Load Presets',
      onAction: () => {
        onClose();
        onOpenExportImport('presets');
      }
    },
    {
      id: 'tool-pipeline',
      name: 'Multi-Language Pipeline',
      category: 'code',
      categoryLabel: 'PIPELINE',
      badge: 'CHAINED',
      badgeColor: 'text-purple-300 bg-purple-950/80 border-purple-800/40',
      description: 'Chain C++, Luau, QuickJS and Kotlin blocks with synchronized sharedState',
      icon: <FileCode2 className="w-4 h-4 text-purple-400" />,
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      actionText: 'Open Pipeline',
      onAction: () => {
        onClose();
        if (onTabChange) onTabChange('home');
      }
    },
    {
      id: 'tool-engine-toggle',
      name: 'Macro Automation Engine',
      category: 'engine',
      categoryLabel: 'ENGINE',
      badge: engineActive ? 'RUNNING' : 'STANDBY',
      badgeColor: engineActive
        ? 'text-emerald-300 bg-emerald-950/80 border-emerald-700/50'
        : 'text-amber-300 bg-amber-950/80 border-amber-800/40',
      description: 'Hardware evdev & AccessibilityService main execution daemon',
      icon: <Cpu className="w-4 h-4 text-cyan-400" />,
      iconBg: 'bg-cyan-500/15 border-cyan-500/30',
      actionText: engineActive ? 'Stop Engine' : 'Start Engine',
      onAction: () => {
        if (onToggleEngine) onToggleEngine();
      }
    }
  ];

  // Filtering
  const filteredTools = useMemo(() => {
    return allTools.filter((t) => {
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [allTools, selectedCategory, searchQuery]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#0e1017] border border-[#23283b] rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col h-[88dvh] max-h-[680px] sm:h-auto sm:max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pinned Compact Header */}
        <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3 border-b border-[#1c2030] bg-[#121520] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-slate-100 truncate">
                  Global Tools & System Utilities
                </h3>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 shrink-0">
                  {allTools.length} TOOLS
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden xs:block">
                All sensor overlays, permissions, exporters, recorder & architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* View Density Switcher */}
            <div className="flex items-center bg-[#181b28] border border-[#24283b] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded ${viewMode === 'grid' ? 'bg-[#252a3d] text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="Grid view"
                aria-label="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-1 rounded ${viewMode === 'compact' ? 'bg-[#252a3d] text-cyan-400' : 'text-slate-400 hover:text-white'}`}
                title="Compact list view"
                aria-label="Compact list view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#181b28] hover:bg-[#22273a] text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-[#23283b]"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Interactive Status & Live Engine Controls */}
        <div className="px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#10131d] border-b border-[#1c2030] flex items-center justify-between text-[10px] sm:text-[11px] font-mono shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* Engine Quick Action */}
            <button
              onClick={onToggleEngine}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
                engineActive
                  ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 hover:bg-emerald-950'
                  : 'bg-amber-950/40 border-amber-800/40 text-amber-300 hover:bg-amber-950/60'
              }`}
            >
              {engineActive ? <Square className="w-2.5 h-2.5 fill-current" /> : <Play className="w-2.5 h-2.5 fill-current" />}
              <span>Engine: <strong>{engineActive ? 'ACTIVE' : 'STANDBY'}</strong></span>
            </button>

            {/* HUD Quick Action */}
            <button
              onClick={onToggleFloatingHud}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded border transition-colors ${
                isHudOpen
                  ? 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300 hover:bg-cyan-950'
                  : 'bg-[#181b28] border-[#252a3d] text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-2.5 h-2.5" />
              <span>HUD: <strong>{isHudOpen ? 'VISIBLE' : 'HIDDEN'}</strong></span>
            </button>
          </div>

          <span className="text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            API 26+ JNI
          </span>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="px-3.5 py-2 border-b border-[#181c2b] bg-[#0c0e15] shrink-0 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools (coords, color, hud, metrics, export...)"
              className="w-full bg-[#131622] border border-[#202538] rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-[10px]">
            {(
              [
                { id: 'all', label: `All (${allTools.length})` },
                { id: 'sensors', label: 'Sensors & HUD' },
                { id: 'code', label: 'Routines & Code' },
                { id: 'system', label: 'Diagnostics & System' }
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-0.5 rounded-md whitespace-nowrap font-medium transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'bg-[#151824] text-slate-400 hover:text-slate-200 border border-[#202436]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body: Scrollable, with min-h-0 to NEVER collapse */}
        <div className="p-3 sm:p-4 overflow-y-auto min-h-0 space-y-2 flex-1">
          {filteredTools.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-[#12141c] border border-[#1e2230] rounded-xl p-4">
              No tools matching "{searchQuery}".
            </div>
          ) : viewMode === 'grid' ? (
            /* High-Density 2-Column Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={tool.onAction}
                  className="p-2.5 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-[#202538] hover:border-cyan-500/40 text-left transition-all group flex flex-col justify-between shadow-xs"
                >
                  <div className="flex items-start justify-between w-full gap-2 mb-1">
                    <span className="font-semibold text-xs text-slate-200 group-hover:text-white flex items-center gap-2 min-w-0">
                      <div className={`w-6 h-6 rounded-lg ${tool.iconBg} flex items-center justify-center shrink-0`}>
                        {tool.icon}
                      </div>
                      <span className="truncate">{tool.name}</span>
                    </span>
                    <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${tool.badgeColor}`}>
                      {tool.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-2 leading-snug mb-1.5">
                    {tool.description}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-cyan-400/90 font-medium pt-1 border-t border-[#181c2b] w-full">
                    <span>{tool.categoryLabel}</span>
                    <span className="flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform text-cyan-300 font-semibold">
                      {tool.actionText} →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Compact List View (Ultra High Density: fits 8+ items at once) */
            <div className="space-y-1.5">
              {filteredTools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={tool.onAction}
                  className="w-full px-3 py-2 rounded-xl bg-[#131622] hover:bg-[#1a1f30] border border-[#202538] hover:border-cyan-500/40 text-left transition-all group flex items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-7 h-7 rounded-lg ${tool.iconBg} flex items-center justify-center shrink-0`}>
                      {tool.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-200 group-hover:text-white truncate">
                          {tool.name}
                        </span>
                        <span className={`text-[8px] font-mono px-1 py-0.2 rounded border shrink-0 ${tool.badgeColor}`}>
                          {tool.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 shrink-0 group-hover:text-cyan-300">
                    <span className="hidden xs:inline">{tool.actionText}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pinned Compact Footer */}
        <div className="px-3.5 py-2 sm:px-4 sm:py-2.5 border-t border-[#1c2030] bg-[#10121c] flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] text-slate-300">
              MacroExecutor Suite · Native Engine Ready
            </span>
          </div>
          <button
            onClick={onClose}
            className="py-1 px-3 rounded-lg bg-[#1c2030] hover:bg-[#282d44] text-slate-200 font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
