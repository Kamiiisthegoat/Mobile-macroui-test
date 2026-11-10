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
    const interval = setInterval(check, 2000); // Poll every 2s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#1a1b1e] border border-[#2a2b30] rounded-lg p-4 space-y-4 shadow-lg">
      <h3 className="text-white font-bold text-lg border-b border-[#2a2b30] pb-2">Native Android Bridge</h3>
      
      <div className="grid grid-cols-3 gap-2 text-xs text-center font-mono">
        <div className={`p-2 rounded border ${status.accessibility ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
          Accessibility<br/>{status.accessibility ? 'READY' : 'OFFLINE'}
        </div>
        <div className={`p-2 rounded border ${status.overlay ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
          Overlay<br/>{status.overlay ? 'READY' : 'OFFLINE'}
        </div>
        <div className={`p-2 rounded border ${status.screenCapture ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
          Screen Capture<br/>{status.screenCapture ? 'READY' : 'OFFLINE'}
        </div>
      </div>

      <div className="flex gap-2 text-xs">
        <button onClick={() => MacroBridge.requestAllPermissions()} className="flex-1 bg-blue-600 py-2 rounded text-white font-bold">
          Grant Permissions
        </button>
        <button onClick={() => MacroBridge.requestScreenCapture()} className="flex-1 bg-purple-600 py-2 rounded text-white font-bold">
          Request Capture
        </button>
      </div>

      <div className="flex gap-2 text-xs">
         <button onClick={() => MacroBridge.startOverlay()} className="flex-1 bg-green-600 py-2 rounded text-white font-bold">
          Start Overlay
        </button>
        <button onClick={() => MacroBridge.stopOverlay()} className="flex-1 bg-red-600 py-2 rounded text-white font-bold">
          Stop Overlay
        </button>
      </div>
    </div>
  );
};
