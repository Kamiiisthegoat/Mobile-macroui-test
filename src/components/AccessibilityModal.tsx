import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, X, Terminal } from 'lucide-react';

interface AccessibilityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilityModal: React.FC<AccessibilityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-start sm:justify-center p-3 sm:p-4 pt-14 sm:pt-6 pb-8 overflow-y-auto select-none">
      <div className="bg-[#12141c] border border-[#212638] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85dvh] shrink-0 mt-2 sm:my-auto">
        {/* Header */}
        <div className="p-4 bg-[#151824] border-b border-[#212638] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              Android System Permissions & Diagnostic
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5 text-xs">
          <p className="text-slate-300 leading-relaxed">
            MacroExecutor requires low-level Android permissions to inject zero-latency touches, render the floating HUD overlay, and capture screen pixels.
          </p>

          <div className="space-y-2 font-mono">
            {/* Permission 1 */}
            <div className="p-2.5 rounded-xl bg-[#0e1017] border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-emerald-400 font-bold">BIND_ACCESSIBILITY_SERVICE</div>
                <div className="text-[10px] text-slate-400">Enables GestureDescription touch dispatching</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Permission 2 */}
            <div className="p-2.5 rounded-xl bg-[#0e1017] border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-emerald-400 font-bold">SYSTEM_ALERT_WINDOW</div>
                <div className="text-[10px] text-slate-400">Allows floating HUD over Roblox and games</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Permission 3 */}
            <div className="p-2.5 rounded-xl bg-[#0e1017] border border-emerald-500/30 flex items-center justify-between">
              <div>
                <div className="text-emerald-400 font-bold">FOREGROUND_SERVICE (SPECIAL_USE)</div>
                <div className="text-[10px] text-slate-400">Keeps macro running with screen off or backgrounded</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>

            {/* Permission 4 */}
            <div className="p-2.5 rounded-xl bg-[#0e1017] border border-cyan-500/30 flex items-center justify-between">
              <div>
                <div className="text-cyan-400 font-bold">NDK /dev/input/event* (evdev)</div>
                <div className="text-[10px] text-slate-400">Hardware touch bypass for 120 FPS games</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            </div>
          </div>

          <div className="p-3 bg-[#0a0b0f] rounded-xl border border-[#212536] space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[11px]">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              ADB Grant Command (Non-Rooted Setup)
            </div>
            <code className="block bg-[#141620] p-2 rounded text-[10px] font-mono text-amber-300 break-all select-all">
              adb shell pm grant com.macroexecutor.app android.permission.SYSTEM_ALERT_WINDOW
            </code>
          </div>
        </div>

        <div className="p-3 bg-[#151824] border-t border-[#212638] flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
