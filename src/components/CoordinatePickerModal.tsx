import React, { useState, useRef, useEffect } from 'react';
import {
  Crosshair,
  Check,
  Copy,
  Upload,
  X,
  Smartphone,
  ArrowRight,
  Sliders,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { ScreenCalibration } from '../types/macro';

interface CoordinatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCoords: (coords: { x: number; y: number }) => void;
  targetBinding?: { configId: string; targetType: 'soru' | 'portal' } | null;
  calibration?: ScreenCalibration;
  onSaveCalibration?: (cal: ScreenCalibration) => void;
}

// Popular Android device screen specs presets
const DEVICE_PRESETS: Array<{
  name: string;
  width: number;
  height: number;
  dpi: number;
  density: string;
}> = [
  { name: 'Samsung Galaxy S24 Ultra', width: 1440, height: 3120, dpi: 505, density: 'xxxhdpi' },
  { name: 'Samsung Galaxy S23/S24', width: 1080, height: 2340, dpi: 425, density: 'xxhdpi' },
  { name: 'Google Pixel 8/9 Pro', width: 1344, height: 2992, dpi: 489, density: 'xxxhdpi' },
  { name: 'Xiaomi / Poco F5 / X6', width: 1080, height: 2400, dpi: 395, density: 'xxhdpi' },
  { name: 'Standard Gaming Phone', width: 1080, height: 1920, dpi: 480, density: 'xxhdpi' },
  { name: 'Android Gaming Tablet', width: 1600, height: 2560, dpi: 280, density: 'mdpi' }
];

export const CoordinatePickerModal: React.FC<CoordinatePickerModalProps> = ({
  isOpen,
  onClose,
  onSelectCoords,
  targetBinding,
  calibration,
  onSaveCalibration
}) => {
  // Calibration gate state (user MUST input DPI & resolution before using picker)
  const [isCalibrated, setIsCalibrated] = useState<boolean>(calibration?.isCalibrated || false);
  const [inputWidth, setInputWidth] = useState<number>(calibration?.width || 1080);
  const [inputHeight, setInputHeight] = useState<number>(calibration?.height || 2400);
  const [inputDpi, setInputDpi] = useState<number>(calibration?.dpi || 440);
  const [selectedDevicePreset, setSelectedDevicePreset] = useState<string>('Xiaomi / Poco F5 / X6');

  // Interactive picker state
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 185, y: 450 });
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [isPointerDown, setIsPointerDown] = useState<boolean>(false);
  const [nudgeStep, setNudgeStep] = useState<1 | 5 | 10>(1);
  const [scenePreset, setScenePreset] = useState<'bloxfruits_standard' | 'bloxfruits_tall' | 'custom'>('bloxfruits_tall');
  const [customImage, setCustomImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbLoupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (calibration) {
      setInputWidth(calibration.width);
      setInputHeight(calibration.height);
      setInputDpi(calibration.dpi);
      setIsCalibrated(calibration.isCalibrated);
    }
  }, [calibration]);

  // Handle Preset selection
  const handleSelectPreset = (preset: typeof DEVICE_PRESETS[0]) => {
    setSelectedDevicePreset(preset.name);
    setInputWidth(preset.width);
    setInputHeight(preset.height);
    setInputDpi(preset.dpi);
  };

  // Complete & Confirm Calibration
  const handleConfirmCalibration = () => {
    if (inputWidth <= 0 || inputHeight <= 0 || inputDpi <= 0) return;
    const newCal: ScreenCalibration = {
      width: inputWidth,
      height: inputHeight,
      dpi: inputDpi,
      deviceName: selectedDevicePreset,
      isCalibrated: true,
      scaleFactor: inputDpi / 160
    };
    setIsCalibrated(true);
    if (onSaveCalibration) onSaveCalibration(newCal);
  };

  // Redraw canvas with resolution scaling
  useEffect(() => {
    if (!isOpen || !isCalibrated || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const w = inputWidth;
    const h = inputHeight;
    canvas.width = w;
    canvas.height = h;

    if (scenePreset === 'custom' && customImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);
      };
      img.src = customImage;
      return;
    }

    // Draw game viewport at calibrated resolution
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0c1b33');
    skyGrad.addColorStop(0.35, '#1e3a5f');
    skyGrad.addColorStop(0.65, '#0a4358');
    skyGrad.addColorStop(1, '#051923');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Island horizon
    ctx.fillStyle = '#0f2b1d';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.55, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Marine fortress
    ctx.fillStyle = '#1c2833';
    ctx.fillRect(w * 0.4, h * 0.44, w * 0.2, h * 0.09);
    ctx.fillRect(w * 0.45, h * 0.4, w * 0.1, h * 0.04);

    // Player HUD
    ctx.fillStyle = 'rgba(10, 14, 23, 0.85)';
    ctx.fillRect(w * 0.05, h * 0.04, w * 0.5, h * 0.07);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.05, h * 0.04, w * 0.5, h * 0.07);

    // Health bar
    ctx.fillStyle = '#10b981';
    ctx.fillRect(w * 0.07, h * 0.07, w * 0.4, h * 0.015);

    // Player text
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w * 0.03)}px sans-serif`;
    ctx.fillText('Pirate King [Lv. 2550 (Max)]', w * 0.07, h * 0.065);

    // Soru Target Icon (X: 185, Y: 450)
    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.roundRect(135, 400, 100, 100, 20);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('[X]', 162, 455);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('SORU', 162, 485);

    // Portal Target Icon (X: 240, Y: 680)
    ctx.fillStyle = '#457B9D';
    ctx.beginPath();
    ctx.roundRect(190, 630, 100, 100, 20);
    ctx.fill();
    ctx.strokeStyle = '#a8dadc';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px monospace';
    ctx.fillText('[Z]', 217, 685);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('PORTAL', 205, 715);

    // Attack Button
    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.beginPath();
    ctx.arc(w * 0.82, h * 0.82, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 6;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(w * 0.04)}px sans-serif`;
    ctx.fillText('ATTACK', w * 0.74, h * 0.83);

    // Initial loupe render
    setTimeout(() => {
      drawLoupeGrid(thumbLoupeCanvasRef.current, coords.x, coords.y);
    }, 50);
  }, [isOpen, isCalibrated, inputWidth, inputHeight, scenePreset, customImage]);

  const drawLoupeGrid = (targetCanvas: HTMLCanvasElement | null, cx: number, cy: number) => {
    if (!targetCanvas || !canvasRef.current) return;
    const loupeCtx = targetCanvas.getContext('2d');
    const mainCtx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!loupeCtx || !mainCtx) return;

    loupeCtx.imageSmoothingEnabled = false;
    loupeCtx.clearRect(0, 0, 120, 120);

    const sampleSize = 11;
    const half = Math.floor(sampleSize / 2);
    const boxSize = 120 / sampleSize;

    const minX = Math.max(0, cx - half);
    const minY = Math.max(0, cy - half);
    const maxX = Math.min(canvasRef.current.width - 1, cx + half);
    const maxY = Math.min(canvasRef.current.height - 1, cy + half);
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;

    const imgData = mainCtx.getImageData(minX, minY, w, h).data;

    for (let dy = -half; dy <= half; dy++) {
      for (let dx = -half; dx <= half; dx++) {
        const px = cx + dx;
        const py = cy + dy;
        const col = dx + half;
        const row = dy + half;

        if (px >= 0 && px < canvasRef.current.width && py >= 0 && py < canvasRef.current.height) {
          const localX = px - minX;
          const localY = py - minY;
          const idx = (localY * w + localX) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          loupeCtx.fillStyle = `rgb(${r},${g},${b})`;
        } else {
          loupeCtx.fillStyle = '#05070a';
        }
        loupeCtx.fillRect(col * boxSize, row * boxSize, boxSize, boxSize);
      }
    }

    // Grid lines for single pixels
    loupeCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    loupeCtx.lineWidth = 0.5;
    for (let i = 0; i <= sampleSize; i++) {
      loupeCtx.beginPath();
      loupeCtx.moveTo(i * boxSize, 0);
      loupeCtx.lineTo(i * boxSize, 120);
      loupeCtx.stroke();

      loupeCtx.beginPath();
      loupeCtx.moveTo(0, i * boxSize);
      loupeCtx.lineTo(120, i * boxSize);
      loupeCtx.stroke();
    }

    // High-contrast cyan crosshair in center
    const centerOffset = half * boxSize;
    loupeCtx.strokeStyle = '#22d3ee';
    loupeCtx.lineWidth = 2.5;
    loupeCtx.strokeRect(centerOffset + 0.5, centerOffset + 0.5, boxSize - 1, boxSize - 1);
    loupeCtx.strokeStyle = '#000000';
    loupeCtx.lineWidth = 1;
    loupeCtx.strokeRect(centerOffset + 2, centerOffset + 2, boxSize - 4, boxSize - 4);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsPointerDown(true);
    handlePointerAction(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.buttons === 1 || isPointerDown) {
      e.preventDefault();
      handlePointerAction(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    setIsPointerDown(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerAction = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    const clientX = Math.max(rect.left, Math.min(rect.right, e.clientX));
    const clientY = Math.max(rect.top, Math.min(rect.bottom, e.clientY));

    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    setPointerPos({ x: relX, y: relY });

    const normalizedX = rect.width > 0 ? relX / rect.width : 0;
    const normalizedY = rect.height > 0 ? relY / rect.height : 0;

    const nativeX = Math.round(normalizedX * (canvas.width - 1));
    const nativeY = Math.round(normalizedY * (canvas.height - 1));

    const cx = Math.max(0, Math.min(canvas.width - 1, nativeX));
    const cy = Math.max(0, Math.min(canvas.height - 1, nativeY));

    setCoords({ x: cx, y: cy });
    drawLoupeGrid(thumbLoupeCanvasRef.current, cx, cy);
  };

  const handleNudge = (dx: number, dy: number) => {
    setCoords((prev) => {
      const nextX = Math.max(0, Math.min(inputWidth - 1, prev.x + dx * nudgeStep));
      const nextY = Math.max(0, Math.min(inputHeight - 1, prev.y + dy * nudgeStep));
      drawLoupeGrid(thumbLoupeCanvasRef.current, nextX, nextY);
      return { x: nextX, y: nextY };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setScenePreset('custom');
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none overflow-y-auto">
      {/* ================= STEP 1: SCREEN DPI & RESOLUTION CALIBRATION GATE ================= */}
      {!isCalibrated ? (
        <div className="my-auto w-full max-w-lg bg-[#12141c] border-2 border-cyan-500/50 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-[#212638] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">
                  Screen Calibration Required
                </h3>
                <p className="text-[11px] text-slate-400">
                  Input your exact screen DPI & resolution before using the coordinate picker
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs flex items-start gap-2 leading-relaxed">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              High-speed game macros (Soru-X and evdev touch injection) require exact native pixel geometry
              to calculate sub-pixel touch coordinates without drift.
            </span>
          </div>

          {/* Device Model Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Quick Select Device Preset:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {DEVICE_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedDevicePreset === preset.name
                      ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200'
                      : 'bg-[#161824] border-[#222738] text-slate-400 hover:bg-[#1a1e2d] hover:text-slate-200'
                  }`}
                >
                  <div className="text-[11px] font-bold truncate">{preset.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">
                    {preset.width}×{preset.height} · {preset.dpi} DPI
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fields for Resolution & DPI */}
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  WIDTH (PX)
                </label>
                <input
                  type="number"
                  value={inputWidth}
                  onChange={(e) => setInputWidth(Number(e.target.value))}
                  className="w-full bg-[#0a0c12] border border-[#23283c] rounded-lg px-2.5 py-2 font-mono text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  HEIGHT (PX)
                </label>
                <input
                  type="number"
                  value={inputHeight}
                  onChange={(e) => setInputHeight(Number(e.target.value))}
                  className="w-full bg-[#0a0c12] border border-[#23283c] rounded-lg px-2.5 py-2 font-mono text-xs font-bold text-cyan-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">
                  SCREEN DPI
                </label>
                <input
                  type="number"
                  value={inputDpi}
                  onChange={(e) => setInputDpi(Number(e.target.value))}
                  className="w-full bg-[#0a0c12] border border-[#23283c] rounded-lg px-2.5 py-2 font-mono text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Calculated Geometry Preview */}
            <div className="bg-[#090b10] border border-[#1c2132] rounded-xl p-2.5 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">
                Aspect: <strong className="text-slate-200">{(inputHeight / inputWidth).toFixed(2)}:1</strong>
              </span>
              <span className="text-slate-400">
                Density: <strong className="text-emerald-400">{(inputDpi / 160).toFixed(2)}x (xxhdpi)</strong>
              </span>
              <span className="text-slate-400">
                Total Pixels: <strong className="text-cyan-400">{(inputWidth * inputHeight / 1000000).toFixed(1)} MP</strong>
              </span>
            </div>
          </div>

          <button
            onClick={handleConfirmCalibration}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-[0.99]"
          >
            <Check className="w-4 h-4" />
            Calibrate & Unlock Coordinate Picker
          </button>
        </div>
      ) : (
        /* ================= STEP 2: ACTIVE COORDINATE PICKER OVERLAY ================= */
        <>
          {/* Top Controls Header */}
          <div className="w-full max-w-xl bg-[#12141c] border border-cyan-500/30 rounded-2xl p-3 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-2">
              <Crosshair className="w-5 h-5 text-cyan-400" />
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
                  Coordinate Picker Tool
                  <span className="text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 font-bold">
                    {inputDpi} DPI CALIBRATED
                  </span>
                </h3>
                <p className="text-[10px] text-slate-400">
                  {selectedDevicePreset} · {inputWidth} × {inputHeight} px
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Recalibrate DPI button */}
              <button
                onClick={() => setIsCalibrated(false)}
                className="px-2 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-slate-300 border border-[#2b334a] text-[10px] font-mono font-semibold"
                title="Change Screen DPI & Resolution"
              >
                Recalibrate DPI
              </button>

              <label className="px-2 py-1 rounded-lg bg-[#181d2a] hover:bg-[#202738] text-slate-300 border border-[#2b334a] text-[10px] font-mono cursor-pointer">
                <Upload className="w-3 h-3 inline mr-1" />
                Upload Pic
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              <button onClick={onClose} className="p-1.5 rounded-lg bg-[#181b26] text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Interactive Screen Canvas with Above-Thumb Floating Loupe */}
          {(() => {
            const canvasW = canvasRef.current?.clientWidth || 280;
            const canvasH = canvasRef.current?.clientHeight || 450;
            const curRelX = pointerPos ? pointerPos.x : (coords.x / Math.max(1, inputWidth)) * canvasW;
            const curRelY = pointerPos ? pointerPos.y : (coords.y / Math.max(1, inputHeight)) * canvasH;

            const isNearTop = curRelY < 155;
            const loupeOffsetTop = isNearTop ? curRelY + 35 : Math.max(8, curRelY - 145);
            const loupeOffsetLeft = Math.max(68, Math.min(canvasW - 68, curRelX));

            return (
              <div
                ref={containerRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative my-2 w-full max-w-[320px] rounded-2xl border-2 border-cyan-500/40 overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.25)] cursor-crosshair touch-none select-none"
                style={{ aspectRatio: `${inputWidth} / ${inputHeight}` }}
              >
                <canvas ref={canvasRef} className="w-full h-full block" />

                {/* Reticle Lines matching exact finger / target */}
                <div
                  className="absolute left-0 right-0 border-t border-cyan-400/80 pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  style={{ top: `${curRelY}px` }}
                />
                <div
                  className="absolute top-0 bottom-0 border-l border-cyan-400/80 pointer-events-none shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                  style={{ left: `${curRelX}px` }}
                />

                {/* Crosshair Center Reticle Point (Exactly under the finger) */}
                <div
                  className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center z-10"
                  style={{
                    left: `${curRelX}px`,
                    top: `${curRelY}px`
                  }}
                >
                  <div className="w-4 h-4 rounded-full border-2 border-cyan-300 shadow-[0_0_8px_#000]" />
                  <div className="absolute w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  <div className="absolute w-0.5 h-6 bg-cyan-300/60 pointer-events-none" />
                  <div className="absolute w-6 h-0.5 bg-cyan-300/60 pointer-events-none" />
                </div>

                {/* ================= ABOVE/BELOW-THUMB 12X MAGNIFIER LOUPE HUD ================= */}
                <div
                  className="absolute pointer-events-none -translate-x-1/2 z-20 transition-transform duration-75"
                  style={{
                    left: `${loupeOffsetLeft}px`,
                    top: `${loupeOffsetTop}px`
                  }}
                >
                  {/* Loupe Bubble Container */}
                  <div className="relative bg-[#0d0f17]/95 border-2 border-cyan-400 rounded-2xl p-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)] backdrop-blur-md flex flex-col items-center gap-1">
                    {/* Header Badge */}
                    <div className="flex items-center justify-between w-full px-1 text-[9px] font-mono font-bold text-cyan-300">
                      <span>12× MAGNIFIER</span>
                      <span className="text-white font-mono">({coords.x}, {coords.y})</span>
                    </div>

                    {/* Magnified Canvas Pixel Matrix */}
                    <div className="w-[100px] h-[100px] rounded-xl overflow-hidden border border-white/20 bg-black relative">
                      <canvas ref={thumbLoupeCanvasRef} width={120} height={120} className="w-full h-full" />
                    </div>

                    {/* Live Coordinates Readout */}
                    <div className="flex items-center justify-center gap-1.5 w-full bg-[#161824] px-1.5 py-0.5 rounded-lg border border-white/10 font-mono text-[10.5px] font-bold text-cyan-300">
                      <span>X: {coords.x}</span>
                      <span className="text-slate-500">|</span>
                      <span>Y: {coords.y}</span>
                    </div>

                    {/* Directional Pointer / Stem pointing to touch position */}
                    {isNearTop ? (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-cyan-400" />
                    ) : (
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-cyan-400" />
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* QoL Coordinate Fine-Tuning Nudge Controls & Bottom Actions */}
          <div className="w-full max-w-xl bg-[#12141c] border border-[#202434] rounded-2xl p-3.5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between text-xs">
              <div className="font-mono text-slate-300">
                Target: <span className="font-bold text-cyan-400 text-sm">X: {coords.x}, Y: {coords.y}</span>
              </div>

              {/* QoL Fine Nudge Controls */}
              <div className="flex items-center gap-1.5 bg-[#090b10] p-1 rounded-xl border border-[#1e2333]">
                <span className="text-[10px] text-slate-400 font-mono px-1">Nudge:</span>
                <button
                  onClick={() => handleNudge(-1, 0)}
                  className="p-1 rounded bg-[#171a27] text-slate-300 hover:text-white"
                  title="Nudge Left"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleNudge(0, -1)}
                  className="p-1 rounded bg-[#171a27] text-slate-300 hover:text-white"
                  title="Nudge Up"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleNudge(0, 1)}
                  className="p-1 rounded bg-[#171a27] text-slate-300 hover:text-white"
                  title="Nudge Down"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleNudge(1, 0)}
                  className="p-1 rounded bg-[#171a27] text-slate-300 hover:text-white"
                  title="Nudge Right"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-0.5 ml-1 border-l border-[#272b3c] pl-1.5">
                  {[1, 5, 10].map((step) => (
                    <button
                      key={step}
                      onClick={() => setNudgeStep(step as any)}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${
                        nudgeStep === step ? 'bg-cyan-500/30 text-cyan-300' : 'text-slate-500'
                      }`}
                    >
                      ±{step}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onSelectCoords(coords);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                <Check className="w-3.5 h-3.5" />
                {targetBinding ? `Set ${targetBinding.targetType.toUpperCase()} Coords` : 'Apply Coordinates'}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(`tap(${coords.x}, ${coords.y});`);
                  onClose();
                }}
                className="py-2.5 px-3 rounded-xl bg-[#1a1d2a] hover:bg-[#232738] text-slate-200 border border-[#282d40] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
                Copy tap({coords.x}, {coords.y})
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
