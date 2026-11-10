import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const MacroBridge = registerPlugin<any>('MacroBridge');

export const MacroControlPanel: React.FC = () => {
  const [status, setStatus] = useState({ accessibility: false, overlay: false, screenCapture: false });

  useEffect(() => {
    const check = async () => {
      try { setStatus(await MacroBridge.isReady()); } catch (e) {}
    };
    check();
    const interval = setInterval(check, 2000);
    return () => clearInterval(interval);
  }, []);

  const StatusItem = ({ label, isReady }: { label: string, isReady: boolean }) => (
    <div className="flex items-center justify-between py-2 px-1">
      <span className="text-[#A0A0A5] text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold tracking-wider ${isReady ? 'text-[#4CAF50]' : 'text-[#FF4444]'}`}>
          {isReady ? 'READY' : 'OFFLINE'}
        </span>
        <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-[#4CAF50] shadow-[0_0_8px_#4CAF50]' : 'bg-[#FF4444] shadow-[0_0_8px_#FF4444]'}`} />
      </div>
    </div>
  );

  return (
    <div className="bg-[#1A1B1E] border border-[#2A2B30] rounded-2xl p-5 shadow-2xl">
      <div className="flex items-center justify-between border-b border-[#2A2B30] pb-3 mb-4">
        <h3 className="text-[#E0E2EC] font-bold text-lg tracking-wide">Native Bridge</h3>
        <div className="text-[10px] bg-[#2A2B30] text-[#A0A0A5] px-2 py-1 rounded-md font-mono">
          API 34
        </div>
      </div>
      
      {/* Permission List */}
      <div className="flex flex-col gap-1 mb-5 bg-[#121316] rounded-xl px-3 py-1">
        <StatusItem label="Accessibility" isReady={status.accessibility} />
        <div className="h-[1px] bg-[#2A2B30] w-full" />
        <StatusItem label="Overlay" isReady={status.overlay} />
        <div className="h-[1px] bg-[#2A2B30] w-full" />
        <StatusItem label="Screen Capture" isReady={status.screenCapture} />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => MacroBridge.requestAllPermissions()} 
          className="bg-[#2A2B30] hover:bg-[#3A3B40] text-white text-sm font-medium py-2.5 rounded-xl border border-[#444] transition-all active:scale-95"
        >
          Grant Permissions
        </button>
        <button 
          onClick={() => MacroBridge.requestScreenCapture()} 
          className="bg-[#2A2B30] hover:bg-[#3A3B40] text-white text-sm font-medium py-2.5 rounded-xl border border-[#444] transition-all active:scale-95"
        >
          Request Capture
        </button>
        
        <button 
          onClick={() => MacroBridge.startOverlay()} 
          className="bg-[#1B3A24] hover:bg-[#224A2D] text-[#4CAF50] text-sm font-bold py-2.5 rounded-xl border border-[#4CAF50]/30 transition-all active:scale-95"
        >
          Start Overlay
        </button>
        <button 
          onClick={() => MacroBridge.stopOverlay()} 
          className="bg-[#3A1B1B] hover:bg-[#4A2222] text-[#EF4444] text-sm font-bold py-2.5 rounded-xl border border-[#EF4444]/30 transition-all active:scale-95"
        >
          Stop Overlay
        </button>
      </div>
    </div>
  );
};
