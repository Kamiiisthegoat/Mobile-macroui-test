import React, { useState, useRef, useEffect } from 'react';
import { TerminalLog } from '../types/macro';
import { ChevronDown, ChevronUp, Copy, Trash2, Check, Terminal } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard'; // 🔥 FIX: Native Clipboard

interface OutputTerminalProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  totalElapsedMs: number;
}

export const OutputTerminal: React.FC<OutputTerminalProps> = ({ logs, onClearLogs, totalElapsedMs }) => {
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

  // 🔥 FIX: Native Copy Logic
  const handleCopyLogs = async () => {
    try {
      const text = logs
        .map((l) => `+${l.timestampOffset.toFixed(1)}ms [${l.level}] ${l.message}`)
        .join('\n');
      
      await Clipboard.write({ string: text });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy logs:', err);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'SUCCESS': return 'text-emerald-400';
      case 'GESTURE': return 'text-cyan-400 font-semibold';
      case 'SHARED_STATE': return 'text-purple-400';
      case 'INFO': return 'text-slate-300';
      case 'WARN': return 'text-amber-400';
      case 'ERROR': return 'text-red-400 font-bold';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="bg-[#0b0c10] border border-[#2a2b30] rounded-lg overflow-hidden flex flex-col">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1a1b1e] border-b border-[#2a2b30]">
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors"
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-slate-200">Console Output</span>
          <span className="text-xs text-slate-500">({logs.length})</span>
          {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-emerald-400">+{totalElapsedMs.toFixed(1)}ms</span>
          <button
            onClick={handleCopyLogs}
            className="text-slate-400 hover:text-white transition-colors"
            title="Copy logs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClearLogs}
            className="text-slate-400 hover:text-red-400 transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Filter Buttons */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#121316] border-b border-[#2a2b30] text-xs">
            <span className="text-slate-500">Filter:</span>
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
            className="p-3 h-48 overflow-y-auto font-mono text-xs space-y-1 bg-black"
          >
            {filteredLogs.length === 0 ? (
              <div className="text-slate-600 italic">No log output yet. Run a script or pipeline to stream telemetry.</div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">+{log.timestampOffset.toFixed(1)}ms</span>
                  <span className={`shrink-0 ${getLevelColor(log.level)}`}>[{log.level}]</span>
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
