import React, { useState } from 'react';
import { Play, Pause, Crosshair, Pipette, CircleDot, Minus, Move, Layers } from 'lucide-react';

interface FloatingHudOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  engineActive: boolean;
  onToggleEngine: () => void;
  onOpenCoordsPicker: () => void;
  onOpenColorChecker: () => void;
  onOpenRecorder: () => void;
  executionSpeedMs: number;
  menuSize: number;
}

export const FloatingHudOverlay: React.FC<FloatingHudOverlayProps> = ({
  isOpen,
  onClose,
  engineActive,
  onToggleEngine,
  onOpenCoordsPicker,
  onOpenColorChecker,
  onOpenRecorder,
  executionSpeedMs,
  menuSize
}) => {
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 20, y: 140 });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = React.useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
  }>({
    startX: 0,
    startY: 0,
    initialPosX: 20,
    initialPosY: 140
  });

  const scale = Math.max(0.6, Math.min(1.4, menuSize / 100));

  const handleDragStart = (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: position.x,
      initialPosY: position.y
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handleDragMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    const hudWidth = (isMinimized ? 48 : 272) * scale;
    const hudHeight = (isMinimized ? 48 : 175) * scale;

    const minX = 4;
    const maxX = Math.max(minX, window.innerWidth - hudWidth - 4);
    const minY = 4;
    const maxY = Math.max(minY, window.innerHeight - hudHeight - 4);

    const targetX = dragStartRef.current.initialPosX + dx;
    const targetY = dragStartRef.current.initialPosY + dy;

    setPosition({
      x: Math.max(minX, Math.min(maxX, Math.round(targetX))),
      y: Math.max(minY, Math.min(maxY, Math.round(targetY)))
    });
  };

  const handleDragEnd = (e: React.PointerEvent<HTMLElement>) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  if (!isOpen) return null;

  if (isMinimized) {
    return (
      <div
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        className="fixed z-50 cursor-grab active:cursor-grabbing select-none touch-none"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
          }}
          className="w-12 h-12 rounded-full bg-[#12141c]/95 border-2 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] flex items-center justify-center text-emerald-400 backdrop-blur-md active:scale-95 transition-transform"
          title="Tap to Expand Floating HUD (Drag to Move)"
        >
          <Layers className="w-5 h-5 animate-pulse" />
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top left'
      }}
      className="fixed z-50 select-none cursor-default touch-none"
    >
      <div className="bg-[#0f1118]/95 border border-emerald-500/40 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.85),0_0_20px_rgba(16,185,129,0.25)] backdrop-blur-lg overflow-hidden w-68">
        {/* Header Draggable Handle */}
        <div
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
          className="bg-[#151824] px-3 py-2 border-b border-[#212638] flex items-center justify-between cursor-grab active:cursor-grabbing touch-none select-none"
        >
          <div className="flex items-center gap-1.5 pointer-events-none">
            <Move className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-[11px] text-white tracking-wider flex items-center gap-1.5">
              MacroExecutor HUD
              <span className={`w-1.5 h-1.5 rounded-full ${engineActive ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#202538] transition-colors"
              title="Minimize to Bubble"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-[#202538] transition-colors"
              title="Close HUD"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">JNI Evdev Status:</span>
            <span className={`font-bold ${engineActive ? 'text-emerald-400' : 'text-slate-400'}`}>
              {engineActive ? 'Active (NDK Ready)' : 'Standby'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400">Inter-step Delay:</span>
            <span className="text-emerald-400 font-bold">{executionSpeedMs} ms</span>
          </div>

          {/* Quick Action 4-Grid */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            <button
              onClick={onToggleEngine}
              className={`py-2 px-1 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
                engineActive
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {engineActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run
                </>
              )}
            </button>

            <button
              onClick={onOpenCoordsPicker}
              className="py-2 px-1 rounded-lg bg-[#181c2b] hover:bg-[#22273d] text-cyan-300 border border-cyan-500/30 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors"
              title="Coordinate Picker"
            >
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              Coords
            </button>

            <button
              onClick={onOpenColorChecker}
              className="py-2 px-1 rounded-lg bg-[#181c2b] hover:bg-[#22273d] text-pink-300 border border-pink-500/30 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors"
              title="Pixel Color Checker"
            >
              <Pipette className="w-3.5 h-3.5 text-pink-400" />
              Color
            </button>

            <button
              onClick={onOpenRecorder}
              className="py-2 px-1 rounded-lg bg-[#181c2b] hover:bg-[#22273d] text-amber-300 border border-amber-500/30 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors"
              title="Gesture Recorder & Photos"
            >
              <CircleDot className="w-3.5 h-3.5 text-amber-400" />
              Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
