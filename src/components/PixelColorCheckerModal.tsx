import React, { useState, useRef, useEffect } from 'react';
import { Pipette, Check, Copy, Upload, X, Eye, History, Sparkles } from 'lucide-react';

interface PixelColorCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (hexColor: string, coords: { x: number; y: number }) => void;
  targetBinding?: { configId: string; targetType: 'soru' | 'portal' } | null;
}

export const PixelColorCheckerModal: React.FC<PixelColorCheckerModalProps> = ({
  isOpen,
  onClose,
  onSelectColor,
  targetBinding
}) => {
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 185, y: 450 });
  const [hexColor, setHexColor] = useState<string>('#E63946');
  const [rgbColor, setRgbColor] = useState<{ r: number; g: number; b: number }>({ r: 230, g: 57, b: 70 });
  const [nativeResolution, setNativeResolution] = useState<{ width: number; height: number }>({
    width: 1080,
    height: 1920
  });
  const [scenePreset, setScenePreset] = useState<'bloxfruits_standard' | 'bloxfruits_tall' | 'custom'>('bloxfruits_standard');
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [colorTolerance, setColorTolerance] = useState<number>(5);

  // Above-Thumb Magnifier Touch Tracking State
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const [isPointerDown, setIsPointerDown] = useState<boolean>(false);

  // QoL: Recently Picked Colors Palette
  const [recentColors, setRecentColors] = useState<Array<{ hex: string; coords: { x: number; y: number } }>>([
    { hex: '#E63946', coords: { x: 185, y: 450 } },
    { hex: '#457B9D', coords: { x: 240, y: 680 } },
    { hex: '#FF0055', coords: { x: 540, y: 960 } }
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbLoupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const staticLoupeCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Redraw canvas with resolution scaling
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (scenePreset === 'custom' && customImage) {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || 1080;
        const h = img.naturalHeight || 1920;
        setNativeResolution({ width: w, height: h });
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        samplePixel(coords.x, coords.y, ctx);
      };
      img.src = customImage;
      return;
    }

    const w = scenePreset === 'bloxfruits_tall' ? 1080 : 1080;
    const h = scenePreset === 'bloxfruits_tall' ? 2400 : 1920;
    setNativeResolution({ width: w, height: h });
    canvas.width = w;
    canvas.height = h;

    // Draw game frame
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#0c1b33');
    skyGrad.addColorStop(0.35, '#1e3a5f');
    skyGrad.addColorStop(0.65, '#0a4358');
    skyGrad.addColorStop(1, '#051923');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // Island
    ctx.fillStyle = '#0f2b1d';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.55, w * 0.55, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Soru Target Button (Crimson Red #E63946)
    ctx.fillStyle = '#E63946';
    ctx.beginPath();
    ctx.roundRect(135, 400, 100, 100, 20);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Portal Target Button (Steel Blue #457B9D)
    ctx.fillStyle = '#457B9D';
    ctx.beginPath();
    ctx.roundRect(190, 630, 100, 100, 20);
    ctx.fill();
    ctx.strokeStyle = '#a8dadc';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Ken Alert Indicator (Vibrant Neon Pink #FF0055)
    ctx.fillStyle = '#FF0055';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.25, 40, 0, Math.PI * 2);
    ctx.fill();

    samplePixel(coords.x, coords.y, ctx);
  }, [isOpen, scenePreset, customImage]);

  const drawLoupeGrid = (targetCanvas: HTMLCanvasElement | null, cx: number, cy: number) => {
    if (!targetCanvas || !canvasRef.current) return;
    const loupeCtx = targetCanvas.getContext('2d');
    const mainCtx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    if (!loupeCtx || !mainCtx) return;

    loupeCtx.imageSmoothingEnabled = false;
    loupeCtx.clearRect(0, 0, 120, 120);

    const sampleSize = 11; // 11x11 pixel window
    const half = Math.floor(sampleSize / 2);
    const boxSize = 120 / sampleSize;

    const minX = Math.max(0, cx - half);
    const minY = Math.max(0, cy - half);
    const maxX = Math.min(canvasRef.current.width - 1, cx + half);
    const maxY = Math.min(canvasRef.current.height - 1, cy + half);
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;

    const imgData = mainCtx.getImageData(minX, minY, w, h).data;

    // Render every cell in the loupe matrix
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

    // High-contrast center target pixel square
    const centerOffset = half * boxSize;
    loupeCtx.strokeStyle = '#ffffff';
    loupeCtx.lineWidth = 2.5;
    loupeCtx.strokeRect(centerOffset + 0.5, centerOffset + 0.5, boxSize - 1, boxSize - 1);
    loupeCtx.strokeStyle = '#000000';
    loupeCtx.lineWidth = 1;
    loupeCtx.strokeRect(centerOffset + 2, centerOffset + 2, boxSize - 4, boxSize - 4);
  };

  const samplePixel = (x: number, y: number, context?: CanvasRenderingContext2D) => {
    const ctx = context || canvasRef.current?.getContext('2d', { willReadFrequently: true });
    if (!ctx || !canvasRef.current) return;

    const clampedX = Math.max(0, Math.min(canvasRef.current.width - 1, Math.round(x)));
    const clampedY = Math.max(0, Math.min(canvasRef.current.height - 1, Math.round(y)));

    const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];

    const toHex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;

    setRgbColor({ r, g, b });
    setHexColor(hex);

    // Update both the above-thumb loupe and sidebar loupe
    drawLoupeGrid(thumbLoupeCanvasRef.current, clampedX, clampedY);
    drawLoupeGrid(staticLoupeCanvasRef.current, clampedX, clampedY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    setIsPointerDown(true);
    updatePointerAndSample(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.buttons === 1 || isPointerDown) {
      e.preventDefault();
      updatePointerAndSample(e);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    setIsPointerDown(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    // Add to recent colors list
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c.hex !== hexColor);
      return [{ hex: hexColor, coords }, ...filtered].slice(0, 6);
    });
  };

  const updatePointerAndSample = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Clamp coordinates strictly to the canvas boundary
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
    samplePixel(cx, cy);
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

  // Compute exact position for above-thumb / below-thumb magnifier
  const canvasW = canvasRef.current?.clientWidth || 280;
  const canvasH = canvasRef.current?.clientHeight || 450;
  const curRelX = pointerPos ? pointerPos.x : (coords.x / nativeResolution.width) * canvasW;
  const curRelY = pointerPos ? pointerPos.y : (coords.y / nativeResolution.height) * canvasH;

  const isNearTop = curRelY < 155;
  const loupeOffsetTop = isNearTop ? curRelY + 35 : Math.max(8, curRelY - 145);
  const loupeOffsetLeft = Math.max(68, Math.min(canvasW - 68, curRelX));

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-5 select-none overflow-y-auto">
      {/* Top Header */}
      <div className="w-full max-w-xl bg-[#12141c] border border-pink-500/30 rounded-2xl p-3 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          <Pipette className="w-5 h-5 text-pink-400" />
          <div>
            <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
              Pixel Color Checker Tool
              <span className="text-[10px] font-mono text-pink-300 px-2 py-0.5 rounded bg-pink-500/15 border border-pink-500/30 font-bold">
                ABOVE-THUMB LOUPE ACTIVE
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Magnifier floats above finger so touch does not obstruct sampled color
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#090a0f] p-0.5 rounded-lg border border-[#1e2230] text-[10px] font-mono">
            <button
              onClick={() => setScenePreset('bloxfruits_standard')}
              className={`px-2 py-0.5 rounded ${scenePreset === 'bloxfruits_standard' ? 'bg-[#222739] text-white font-bold' : 'text-slate-400'}`}
            >
              Preset
            </button>
            <label className={`px-2 py-0.5 rounded cursor-pointer ${scenePreset === 'custom' ? 'bg-[#222739] text-white font-bold' : 'text-slate-400'}`}>
              <Upload className="w-3 h-3 inline mr-1" />
              Upload Image
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg bg-[#181b26] text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Interactive Screen Canvas with Above-Thumb Floating Loupe */}
      <div className="relative my-2 flex items-center gap-4">
        {/* Phone Frame */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative w-full max-w-[280px] sm:max-w-[320px] rounded-2xl border-2 border-pink-500/40 overflow-hidden shadow-[0_0_30px_rgba(236,72,153,0.25)] cursor-crosshair touch-none select-none"
          style={{ aspectRatio: `${nativeResolution.width} / ${nativeResolution.height}` }}
        >
          <canvas ref={canvasRef} className="w-full h-full block" />

          {/* Reticle Touch Point Indicator (under the finger) */}
          <div
            className="absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full border-2 border-white shadow-[0_0_8px_#000] flex items-center justify-center z-10"
            style={{
              left: `${curRelX}px`,
              top: `${curRelY}px`
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
            <div className="absolute w-0.5 h-6 bg-white/70 pointer-events-none" />
            <div className="absolute w-6 h-0.5 bg-white/70 pointer-events-none" />
          </div>

          {/* ================= ABOVE/BELOW-THUMB FLOATING MAGNIFIER LOUPE HUD ================= */}
          <div
            className="absolute pointer-events-none -translate-x-1/2 z-20 transition-transform duration-75"
            style={{
              left: `${loupeOffsetLeft}px`,
              top: `${loupeOffsetTop}px`
            }}
          >
            {/* Loupe Bubble Container */}
            <div className="relative bg-[#0d0f17]/95 border-2 border-pink-400 rounded-2xl p-1.5 shadow-[0_0_20px_rgba(236,72,153,0.4)] backdrop-blur-md flex flex-col items-center gap-1">
              {/* Header Badge */}
              <div className="flex items-center justify-between w-full px-1 text-[9px] font-mono font-bold text-pink-300">
                <span>12× MAGNIFIER</span>
                <span className="text-white font-mono">({coords.x}, {coords.y})</span>
              </div>

              {/* Magnified Canvas Pixel Matrix */}
              <div className="w-[100px] h-[100px] rounded-xl overflow-hidden border border-white/20 bg-black relative">
                <canvas ref={thumbLoupeCanvasRef} width={120} height={120} className="w-full h-full" />
              </div>

              {/* Live Color Swatch & Hex Readout */}
              <div className="flex items-center gap-1.5 w-full bg-[#161824] px-1.5 py-0.5 rounded-lg border border-white/10">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-xs shrink-0"
                  style={{ backgroundColor: hexColor }}
                />
                <span className="font-mono font-bold text-white text-[11px]">{hexColor}</span>
              </div>

              {/* Directional Pointer / Stem pointing to touch position */}
              {isNearTop ? (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-pink-400" />
              ) : (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-pink-400" />
              )}
            </div>
          </div>
        </div>

        {/* Dedicated 10X Magnifier Loupe Floating Sidebar for Desktop */}
        <div className="hidden sm:flex flex-col items-center gap-2 bg-[#10121a] border border-pink-500/30 rounded-2xl p-3 shadow-xl">
          <div className="text-[10px] font-mono text-pink-300 font-bold flex items-center gap-1">
            <Eye className="w-3 h-3" />
            10× PIXEL LOUPE
          </div>

          <div className="w-[120px] h-[120px] rounded-xl border border-white/20 overflow-hidden bg-black shadow-inner">
            <canvas ref={staticLoupeCanvasRef} width={120} height={120} className="w-full h-full" />
          </div>

          <div
            className="w-full h-7 rounded-lg border border-white/30 shadow-md"
            style={{ backgroundColor: hexColor }}
          />

          <div className="text-center font-mono">
            <div className="text-xs font-bold text-white">{hexColor}</div>
            <div className="text-[10px] text-slate-400">
              rgb({rgbColor.r}, {rgbColor.g}, {rgbColor.b})
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Assignment Action Bar & Recent Colors Palette (QoL) */}
      <div className="w-full max-w-xl bg-[#12141c] border border-[#202434] rounded-2xl p-3.5 space-y-3 shadow-2xl">
        {/* QoL: Recently Picked Colors Palette */}
        <div className="flex items-center justify-between bg-[#0a0c12] px-3 py-1.5 rounded-xl border border-[#1d2232] text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
            <History className="w-3.5 h-3.5 text-pink-400" />
            <span>Recent Colors:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {recentColors.map((rc, idx) => (
              <button
                key={`${rc.hex}-${idx}`}
                onClick={() => {
                  setHexColor(rc.hex);
                  setCoords(rc.coords);
                  samplePixel(rc.coords.x, rc.coords.y);
                }}
                className="w-5 h-5 rounded-md border border-white/30 hover:scale-110 transition-transform shadow-xs"
                style={{ backgroundColor: rc.hex }}
                title={`${rc.hex} at (${rc.coords.x}, ${rc.coords.y})`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className="w-5 h-5 rounded-md border border-white/30 shadow-xs"
              style={{ backgroundColor: hexColor }}
            />
            <span className="font-mono font-bold text-white text-sm">{hexColor}</span>
            <span className="font-mono text-slate-400 text-[10px]">
              rgb({rgbColor.r}, {rgbColor.g}, {rgbColor.b})
            </span>
          </div>

          <div className="font-mono text-xs text-slate-300">
            Location: <span className="text-pink-400 font-bold">({coords.x}, {coords.y})</span>
          </div>
        </div>

        {/* Tolerance Slider */}
        <div className="flex items-center justify-between text-xs bg-[#0b0c10] px-3 py-1.5 rounded-lg border border-[#1e2230]">
          <span className="text-slate-400 text-[11px]">Match Tolerance (Delta-E):</span>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="1"
              max="20"
              value={colorTolerance}
              onChange={(e) => setColorTolerance(Number(e.target.value))}
              className="w-24 accent-pink-400 h-1 bg-[#252837] rounded"
            />
            <span className="font-mono text-[10px] text-pink-300">±{colorTolerance}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onSelectColor(hexColor, coords);
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl bg-pink-500 hover:bg-pink-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-[0_0_12px_rgba(236,72,153,0.3)]"
          >
            <Check className="w-3.5 h-3.5" />
            {targetBinding ? `Set ${targetBinding.targetType.toUpperCase()} Color` : 'Apply Color Code'}
          </button>

          <button
            onClick={() => {
              navigator.clipboard.writeText(`if (getPixel(${coords.x}, ${coords.y}) === "${hexColor}")`);
              onClose();
            }}
            className="py-2.5 px-3 rounded-xl bg-[#1a1d2a] hover:bg-[#232738] text-slate-200 border border-[#282d40] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-pink-400" />
            Copy getPixel() Condition
          </button>
        </div>
      </div>
    </div>
  );
};
