import React, { useState, useRef } from 'react';
import { ScriptLanguage } from '../types/macro';
import { Play, Square, RotateCcw, Copy, Check, Plus, MousePointer, Camera, Upload, Image as ImageIcon } from 'lucide-react';

interface RecordedEvent {
  id: string;
  type: 'tap' | 'swipe' | 'hold' | 'picture';
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  durationMs?: number;
  delayBeforeMs?: number;
  pictureData?: string;
  pictureName?: string;
}

interface GestureRecorderModalProps {
  onInsertIntoPipeline: (code: string, lang: ScriptLanguage) => void;
  onInsertIntoSingleEngine: (code: string) => void;
  onLog: (level: 'INFO' | 'SUCCESS' | 'GESTURE' | 'SHARED_STATE' | 'ERROR', msg: string) => void;
}

export const GestureRecorderModal: React.FC<GestureRecorderModalProps> = ({
  onInsertIntoPipeline,
  onInsertIntoSingleEngine,
  onLog
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [events, setEvents] = useState<RecordedEvent[]>([]);
  const [selectedLang, setSelectedLang] = useState<ScriptLanguage>('quickjs');
  const [copied, setCopied] = useState(false);
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 1080, height: 1920 });
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastEventTimeRef = useRef<number>(Date.now());

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!isRecording || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * resolution.width);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * resolution.height);

    touchStartRef.current = { x, y, time: Date.now() };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isRecording || !touchStartRef.current || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const endX = Math.round(((e.clientX - rect.left) / rect.width) * resolution.width);
    const endY = Math.round(((e.clientY - rect.top) / rect.height) * resolution.height);
    const now = Date.now();
    const duration = Math.max(15, now - touchStartRef.current.time);
    const delayBefore = Math.min(2000, Math.max(10, touchStartRef.current.time - lastEventTimeRef.current));
    lastEventTimeRef.current = now;

    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    let newEvent: RecordedEvent;

    if (distance > 40) {
      newEvent = {
        id: `ev-${Date.now()}`,
        type: 'swipe',
        startX: touchStartRef.current.x,
        startY: touchStartRef.current.y,
        endX,
        endY,
        durationMs: Math.max(60, duration),
        delayBeforeMs: delayBefore
      };
      onLog('GESTURE', `[RECORDER] Captured Swipe: (${touchStartRef.current.x}, ${touchStartRef.current.y}) -> (${endX}, ${endY}) [${duration}ms]`);
    } else if (duration > 400) {
      newEvent = {
        id: `ev-${Date.now()}`,
        type: 'hold',
        startX: touchStartRef.current.x,
        startY: touchStartRef.current.y,
        durationMs: duration,
        delayBeforeMs: delayBefore
      };
      onLog('GESTURE', `[RECORDER] Captured Hold: (${touchStartRef.current.x}, ${touchStartRef.current.y}) duration: ${duration}ms`);
    } else {
      newEvent = {
        id: `ev-${Date.now()}`,
        type: 'tap',
        startX: touchStartRef.current.x,
        startY: touchStartRef.current.y,
        durationMs: Math.min(35, duration),
        delayBeforeMs: delayBefore
      };
      onLog('GESTURE', `[RECORDER] Captured Tap: (${touchStartRef.current.x}, ${touchStartRef.current.y})`);
    }

    setEvents((prev) => [...prev, newEvent]);
    touchStartRef.current = null;
  };

  // Take Picture / Snap Frame Feature
  const handleTakePicture = () => {
    const picIndex = events.filter((e) => e.type === 'picture').length + 1;
    const picName = `frame_snap_${picIndex}.png`;
    const now = Date.now();
    const delayBefore = Math.min(2000, Math.max(10, now - lastEventTimeRef.current));
    lastEventTimeRef.current = now;

    const picEvent: RecordedEvent = {
      id: `pic-${Date.now()}`,
      type: 'picture',
      pictureName: picName,
      delayBeforeMs: delayBefore,
      durationMs: 80
    };

    setEvents((prev) => [...prev, picEvent]);
    onLog('SUCCESS', `[CAMERA] Picture captured: ${picName} (${resolution.width}×${resolution.height}px native)`);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new Image();
        img.onload = () => {
          setResolution({ width: img.naturalWidth || 1080, height: img.naturalHeight || 1920 });
          setBackgroundImage(dataUrl);
          onLog('INFO', `[RECORDER] Adopted picture background: ${img.naturalWidth}×${img.naturalHeight}px`);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleRecording = () => {
    if (!isRecording) {
      lastEventTimeRef.current = Date.now();
      setIsRecording(true);
      onLog('INFO', '[RECORDER] Started gesture recording session. Tap, swipe, or snap pictures...');
    } else {
      setIsRecording(false);
      onLog('SUCCESS', `[RECORDER] Recording stopped. Total events captured: ${events.length}`);
    }
  };

  const handleClear = () => {
    setEvents([]);
    touchStartRef.current = null;
  };

  const generateScriptFromEvents = (): string => {
    if (events.length === 0) {
      return '// Perform gestures or take pictures on the virtual touch pad above to synthesize code...';
    }

    switch (selectedLang) {
      case 'cpp': {
        const lines: string[] = ['// Synthesized C++ NDK Kernel Sequence', 'void runRecordedSequence() {'];
        events.forEach((g, idx) => {
          if (idx > 0 && g.delayBeforeMs && g.delayBeforeMs > 20) {
            lines.push(`    preciseSleep(${g.delayBeforeMs});`);
          }
          if (g.type === 'tap') {
            lines.push(`    nativeTap(${g.startX}.0f, ${g.startY}.0f, ${g.durationMs});`);
          } else if (g.type === 'hold') {
            lines.push(`    nativeHold(${g.startX}.0f, ${g.startY}.0f, ${g.durationMs});`);
          } else if (g.type === 'swipe') {
            lines.push(`    nativeSwipe(${g.startX}, ${g.startY}, ${g.endX}, ${g.endY}, ${g.durationMs});`);
          } else if (g.type === 'picture') {
            lines.push(`    captureScreenBuffer("${g.pictureName}");`);
          }
        });
        lines.push('}');
        return lines.join('\n');
      }

      case 'luau': {
        const lines: string[] = ['-- Synthesized Luau Macro Sequence'];
        events.forEach((g, idx) => {
          if (idx > 0 && g.delayBeforeMs && g.delayBeforeMs > 20) {
            lines.push(`wait(${g.delayBeforeMs})`);
          }
          if (g.type === 'tap') {
            lines.push(`tap(${g.startX}, ${g.startY})`);
          } else if (g.type === 'hold') {
            lines.push(`hold(${g.startX}, ${g.startY}, ${g.durationMs})`);
          } else if (g.type === 'swipe') {
            lines.push(`swipe(${g.startX}, ${g.startY}, ${g.endX}, ${g.endY}, ${g.durationMs})`);
          } else if (g.type === 'picture') {
            lines.push(`takeScreenshot("${g.pictureName}")`);
          }
        });
        return lines.join('\n');
      }

      case 'quickjs':
      case 'js': {
        const lines: string[] = ['// Synthesized QuickJS Automation Sequence'];
        events.forEach((g, idx) => {
          if (idx > 0 && g.delayBeforeMs && g.delayBeforeMs > 20) {
            lines.push(`wait(${g.delayBeforeMs});`);
          }
          if (g.type === 'tap') {
            lines.push(`tap(${g.startX}, ${g.startY});`);
          } else if (g.type === 'hold') {
            lines.push(`hold(${g.startX}, ${g.startY}, ${g.durationMs});`);
          } else if (g.type === 'swipe') {
            lines.push(`swipe(${g.startX}, ${g.startY}, ${g.endX}, ${g.endY}, ${g.durationMs});`);
          } else if (g.type === 'picture') {
            lines.push(`captureScreen("${g.pictureName}");`);
          }
        });
        return lines.join('\n');
      }

      case 'kt': {
        const lines: string[] = ['// Synthesized Kotlin AutomationBridge Sequence'];
        events.forEach((g, idx) => {
          if (idx > 0 && g.delayBeforeMs && g.delayBeforeMs > 20) {
            lines.push(`Thread.sleep(${g.delayBeforeMs}L)`);
          }
          if (g.type === 'tap') {
            lines.push(`AutomationBridge.dispatchTap(${g.startX}f, ${g.startY}f, ${g.durationMs}L)`);
          } else if (g.type === 'hold') {
            lines.push(`AutomationBridge.dispatchHold(${g.startX}f, ${g.startY}f, ${g.durationMs}L)`);
          } else if (g.type === 'swipe') {
            lines.push(`AutomationBridge.dispatchSwipe(${g.startX}f, ${g.startY}f, ${g.endX}f, ${g.endY}f, ${g.durationMs}L)`);
          } else if (g.type === 'picture') {
            lines.push(`AutomationBridge.takeScreenPicture("${g.pictureName}")`);
          }
        });
        return lines.join('\n');
      }
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateScriptFromEvents());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-[#12141c] border border-amber-500/30 rounded-xl p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold tracking-wider text-slate-100">
              GESTURE RECORDER & CAMERA FRAME CAPTURE
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
            AUTO-SCALED ({resolution.width}×{resolution.height})
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Record physical taps, holds, swipes, and capture screen pictures at exact native resolution. Synthesizes sequentially into runnable code.
        </p>
      </div>

      {/* Touch Pad Recording Surface */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`} />
            <span className="font-semibold text-slate-200">
              {isRecording ? `Recording (${resolution.width}×${resolution.height}px)` : 'Touch Pad Ready'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Take Picture Button */}
            <button
              onClick={handleTakePicture}
              className="px-2.5 py-1.5 rounded-lg bg-[#191d2c] hover:bg-[#22293e] text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Capture Picture / Take Screenshot"
            >
              <Camera className="w-3.5 h-3.5" />
              Take Picture
            </button>

            {/* Upload Background Picture */}
            <label className="p-1.5 rounded-lg bg-[#191b26] hover:bg-[#222536] text-slate-300 border border-[#232738] cursor-pointer" title="Load Picture to Trace">
              <Upload className="w-3.5 h-3.5" />
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>

            {/* Record / Stop */}
            <button
              onClick={handleToggleRecording}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                isRecording
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Record
                </>
              )}
            </button>

            <button
              onClick={handleClear}
              disabled={events.length === 0}
              className="p-1.5 rounded-lg bg-[#191b26] hover:bg-[#222536] text-slate-400 hover:text-white disabled:opacity-30 border border-[#232738] transition-colors"
              title="Clear Sequence"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Touch Surface Area */}
        <div
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className={`relative w-full h-64 rounded-xl border-2 transition-colors touch-none cursor-crosshair flex items-center justify-center select-none overflow-hidden ${
            isRecording
              ? 'bg-[#0f111a] border-red-500/50 shadow-[inset_0_0_20px_rgba(239,68,68,0.15)]'
              : 'bg-[#0a0b0f] border-[#1e2230]'
          }`}
          style={{
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Subtle grid */}
          {!backgroundImage && (
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]" />
          )}

          {events.length === 0 ? (
            <div className="text-center p-4 pointer-events-none bg-black/40 rounded-xl backdrop-blur-xs">
              <p className="text-xs font-medium text-slate-300">
                {isRecording
                  ? 'Tap anywhere, swipe, or click "Take Picture" above...'
                  : 'Press "Record" to capture gestures or "Take Picture"'}
              </p>
              <p className="text-[10px] text-cyan-300 mt-1 font-mono">
                Native Coordinates: 0 - {resolution.width} × 0 - {resolution.height}
              </p>
            </div>
          ) : (
            <div className="absolute inset-0 pointer-events-none p-2">
              {events.map((g, idx) => {
                if (g.type === 'picture') return null;
                const posX = ((g.startX ?? 0) / resolution.width) * 100;
                const posY = ((g.startY ?? 0) / resolution.height) * 100;

                return (
                  <div
                    key={g.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${posX}%`, top: `${posY}%` }}
                  >
                    {g.type === 'tap' && (
                      <span className="w-6 h-6 rounded-full bg-emerald-400/30 border-2 border-emerald-400 flex items-center justify-center text-[9px] font-mono font-bold text-white shadow-[0_0_8px_rgba(16,185,129,0.8)]">
                        {idx + 1}
                      </span>
                    )}
                    {g.type === 'hold' && (
                      <span className="w-8 h-8 rounded-full bg-amber-400/30 border-2 border-amber-400 flex items-center justify-center text-[9px] font-mono font-bold text-white shadow-[0_0_8px_rgba(251,191,36,0.8)]">
                        {idx + 1}
                      </span>
                    )}
                    {g.type === 'swipe' && g.endX !== undefined && g.endY !== undefined && (
                      <div className="relative">
                        <span className="w-6 h-6 rounded-full bg-cyan-400/30 border-2 border-cyan-400 flex items-center justify-center text-[9px] font-mono font-bold text-white shadow-[0_0_8px_rgba(56,189,248,0.8)]">
                          {idx + 1}
                        </span>
                        <div className="absolute left-6 top-1 text-[9px] font-mono text-cyan-300 whitespace-nowrap bg-black/60 px-1 rounded">
                          Swipe ➔ ({g.endX}, {g.endY})
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Captured Events Timeline */}
      <div className="bg-[#12141c] border border-[#1e2230] rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
          <span>Captured Sequence ({events.length} Actions)</span>
          <span className="font-mono text-[10px] text-slate-400">
            Total Elapsed: {events.reduce((acc, g) => acc + (g.delayBeforeMs || 0) + (g.durationMs || 0), 0)}ms
          </span>
        </div>

        {events.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic">No gestures or pictures recorded yet.</p>
        ) : (
          <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
            {events.map((g, idx) => (
              <div
                key={g.id}
                className="bg-[#0e1017] p-2 rounded-lg border border-[#1e2130] flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">#{idx + 1}</span>
                  <span className={`font-bold ${
                    g.type === 'tap'
                      ? 'text-emerald-400'
                      : g.type === 'hold'
                      ? 'text-amber-400'
                      : g.type === 'swipe'
                      ? 'text-cyan-400'
                      : 'text-purple-400'
                  }`}>
                    {g.type.toUpperCase()}
                  </span>
                  {g.type === 'picture' ? (
                    <span className="text-purple-300 flex items-center gap-1">
                      <Camera className="w-3 h-3" />
                      {g.pictureName}
                    </span>
                  ) : (
                    <span className="text-slate-300">
                      ({g.startX}, {g.startY}) {g.endX ? `➔ (${g.endX}, ${g.endY})` : ''}
                    </span>
                  )}
                </div>
                <div className="text-slate-400 text-[10px]">
                  {g.durationMs}ms {g.delayBeforeMs && g.delayBeforeMs > 20 ? `· +${g.delayBeforeMs}ms` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Synthesized Script Output */}
      <div className="bg-[#12141c] border border-[#1e2230] rounded-xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-200">
            Synthesized Script Output
          </span>

          <div className="flex items-center gap-1 bg-[#0b0c10] p-0.5 rounded-lg border border-[#202434]">
            {(['quickjs', 'luau', 'cpp', 'kt'] as ScriptLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium transition-all ${
                  selectedLang === lang
                    ? 'bg-[#222739] text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0b0f] p-3 rounded-lg border border-[#1e2230] max-h-40 overflow-y-auto">
          <pre className="font-mono text-xs text-amber-300/90 leading-relaxed whitespace-pre">
            {generateScriptFromEvents()}
          </pre>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onInsertIntoPipeline(generateScriptFromEvents(), selectedLang)}
            disabled={events.length === 0}
            className="py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to Pipeline
          </button>

          <button
            onClick={handleCopy}
            disabled={events.length === 0}
            className="py-2 px-3 rounded-lg bg-[#181a26] hover:bg-[#202335] disabled:opacity-40 text-slate-200 border border-[#272b3d] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            Copy Code
          </button>
        </div>
      </div>
    </div>
  );
};
