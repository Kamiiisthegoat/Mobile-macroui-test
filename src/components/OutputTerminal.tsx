import React, { useState, useRef, useEffect } from 'react';
import { TerminalLog } from '../types/macro';
import { ChevronDown, ChevronUp, Copy, Trash2, Check, Terminal } from 'lucide-react';

interface OutputTerminalProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  totalElapsedMs: number;
}

export const OutputTerminal: React.FC<OutputTerminalProps> = ({
  logs,
  onClearLogs,
  totalElapsedMs
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filter, setFilter] = useState<'all' | 'gestures' | 'errors'>('all');
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    if (filter === 'gestures') return log.level === 'GESTURE';
    if (filter === 'errors') return log.level === 'ERROR' || log.level === 'WARN';
    return true;
  });

  useEffect(() => {
    if (scrollRef.current && !isCollapsed) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isCollapsed]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `+${l.timestampOffset.toFixed(1)}ms [${l.level}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-emerald-400';
      case 'GESTURE':
        return 'text-cyan-400 font-semibold';
      case 'SHARED_STATE':
        return 'text-purple-400';
      case 'INFO':
        return 'text-slate-300';
      case 'WARN':
        return 'text-amber-400';
      case 'ERROR':
        return 'text-red-400 font-bold';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-2 select-none">
      <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
        Output Terminal
      </div>

      <div className="bg-[#0b0c10] border border-[#1e2230] rounded-xl overflow-hidden shadow-sm">
        {/* Terminal Header */}
        <div className="bg-[#12141c] px-3.5 py-2.5 border-b border-[#1d202e] flex items-center justify-between">
          <div
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-bold text-xs text-slate-200">
              Console Output
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({logs.length})
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-bold">
              +{totalElapsedMs.toFixed(1)}ms
            </span>

            <button
              onClick={handleCopyLogs}
              title="Copy Output"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#1c1f2c] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onClearLogs}
              title="Clear Console"
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-[#1c1f2c] transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Filter Buttons */}
            <div className="bg-[#0e0f15] px-3.5 py-1.5 border-b border-[#191b26] flex items-center gap-2 text-[11px] font-mono">
              <span className="text-slate-400">Filter:</span>
              <button
                onClick={() => setFilter('all')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filter === 'all' ? 'bg-[#222638] text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('gestures')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filter === 'gestures' ? 'bg-[#222638] text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Gestures
              </button>
              <button
                onClick={() => setFilter('errors')}
                className={`px-2 py-0.5 rounded transition-colors ${
                  filter === 'errors' ? 'bg-[#222638] text-red-300 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Errors
              </button>
            </div>

            {/* Terminal Logs Output */}
            <div
              ref={scrollRef}
              className="p-3 max-h-56 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 bg-[#08090d]"
            >
              {filteredLogs.length === 0 ? (
                <div className="text-slate-400 italic py-2">
                  No log output yet. Run a script or pipeline to stream telemetry.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-2 select-text">
                    <span className="text-slate-400 shrink-0 select-none">
                      +{log.timestampOffset.toFixed(1)}ms
                    </span>
                    <span className={getLevelColor(log.level)}>
                      [{log.level}]
                    </span>
                    <span className="text-slate-200 break-all">
                      {log.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
