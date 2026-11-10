import React from 'react';
import { SpeedSettings } from '../types/macro';

interface SpeedControlsProps {
  settings: SpeedSettings;
  onChange: (updated: SpeedSettings) => void;
}

export const SpeedControls: React.FC<SpeedControlsProps> = ({ settings, onChange }) => {
  return (
    <div className="space-y-3">
      <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
        Timing & Speed
      </div>

      <div className="bg-[#12141c] border border-[#1e2230] rounded-xl p-3.5 space-y-4">
        {/* Trigger Delay */}
        <div>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-300 font-medium">Trigger delay</span>
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#1a1c27] text-slate-200 border border-[#262a3a]">
              {settings.triggerDelayMs} ms
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="250"
            step="1"
            value={settings.triggerDelayMs}
            onChange={(e) => onChange({ ...settings, triggerDelayMs: Number(e.target.value) })}
            className="w-full accent-emerald-500 h-1.5 bg-[#252837] rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Random Delay Mode */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1a1c28]">
          <div className="pr-4">
            <div className="text-xs font-medium text-slate-200">
              Random delay mode
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Adds ±20% jitter for human simulation
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Random delay mode"
            aria-checked={settings.randomDelayMode}
            onClick={() => onChange({ ...settings, randomDelayMode: !settings.randomDelayMode })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.randomDelayMode ? 'bg-emerald-500' : 'bg-[#252837]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-y-0.5 ${
                settings.randomDelayMode ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Execution Speed: Overall Delay between macros (e.g. 5 ms, 10 ms) */}
        <div className="pt-1 border-t border-[#1a1c28]">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <div>
              <span className="text-slate-300 font-medium">Execution speed</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Overall delay between macros</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-[#1a1c27] text-emerald-400 font-bold border border-[#262a3a]">
                {settings.executionSpeedMs} ms
              </span>
            </div>
          </div>

          <input
            type="range"
            min="1"
            max="150"
            step="1"
            value={settings.executionSpeedMs}
            onChange={(e) => onChange({ ...settings, executionSpeedMs: Number(e.target.value) })}
            className="w-full accent-emerald-500 h-1.5 bg-[#252837] rounded-lg appearance-none cursor-pointer"
          />

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
            <button
              onClick={() => onChange({ ...settings, executionSpeedMs: 1 })}
              className="hover:text-emerald-400"
            >
              1ms (NDK Evdev)
            </button>
            <button
              onClick={() => onChange({ ...settings, executionSpeedMs: 5 })}
              className="hover:text-emerald-400"
            >
              5ms (Flash)
            </button>
            <button
              onClick={() => onChange({ ...settings, executionSpeedMs: 10 })}
              className="hover:text-emerald-400"
            >
              10ms (Standard)
            </button>
            <button
              onClick={() => onChange({ ...settings, executionSpeedMs: 50 })}
              className="hover:text-emerald-400"
            >
              50ms (Safe)
            </button>
          </div>
        </div>

        {/* Smart Loop */}
        <div className="flex items-center justify-between pt-1 border-t border-[#1a1c28]">
          <div className="pr-4">
            <div className="text-xs font-medium text-slate-200">
              Smart loop (pause on manual tap)
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Automatically pauses macro if user manually taps screen
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="Smart loop"
            aria-checked={settings.smartLoop}
            onClick={() => onChange({ ...settings, smartLoop: !settings.smartLoop })}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
              settings.smartLoop ? 'bg-emerald-500' : 'bg-[#252837]'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-y-0.5 ${
                settings.smartLoop ? 'translate-x-5.5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
