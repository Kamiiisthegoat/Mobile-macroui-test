import React, { useState, useEffect } from 'react';
import { registerPlugin } from '@capacitor/core';

const MacroBridge = registerPlugin<any>('MacroBridge');

export const MacroControlPanel: React.FC = () => {
  const [isAccessibilityOn, setIsAccessibilityOn] = useState(false);
  const [isOverlayOn, setIsOverlayOn] = useState(false);
  const [isCaptureOn, setIsCaptureOn] = useState(false);
  const [scriptStatus, setScriptStatus] = useState('stopped');
  const [nativeLogs, setNativeLogs] = useState<string[]>([]);
  const [scriptCode, setScriptCode] = useState(`log("Starting script...");\nawait sleep(1000);\nhost.tap(540, 960);`);

  // 1. Listen for real-time messages coming from Kotlin/WebView
  useEffect(() => {
    // Check initial permissions
    checkPermissions();

    const logListener = MacroBridge.addListener('scriptLog', (data: any) => {
      setNativeLogs(prev => [...prev, `> ${data.message}`].slice(-50));
    });

    const statusListener = MacroBridge.addListener('scriptStatus', (data: any) => {
      setScriptStatus(data.state);
      if (data.state === 'error') {
        setNativeLogs(prev => [...prev, `❌ ERROR: ${data.message}`]);
      }
    });

    return () => {
      logListener.remove();
      statusListener.remove();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const status = await MacroBridge.checkPermissionsStatus();
      setIsAccessibilityOn(status.accessibility);
      setIsOverlayOn(status.overlay);
      setIsCaptureOn(status.screenCapture);
    } catch (e) {
      console.log("Bridge not ready", e);
    }
  };

  const requestPermissions = async () => {
    await MacroBridge.requestAllPermissions();
    // User has to manually toggle accessibility, so we check again after a delay
    setTimeout(checkPermissions, 2000); 
  };

  const startCapture = async () => {
    try {
      await MacroBridge.requestScreenCapture();
      checkPermissions();
    } catch (e: any) {
      setNativeLogs(prev => [...prev, `Capture Error: ${e.message}`]);
    }
  };

  const toggleOverlay = async () => {
    try {
      if (isOverlayOn) {
        await MacroBridge.stopOverlay();
      } else {
        await MacroBridge.startOverlay();
      }
      checkPermissions();
    } catch (e: any) {
      setNativeLogs(prev => [...prev, `Overlay Error: ${e.message}`]);
    }
  };

  const runScript = async () => {
    setNativeLogs(prev => [...prev, "▶ Executing script..."]);
    try {
      await MacroBridge.executeQuickJs({ script: scriptCode });
      setScriptStatus('running');
    } catch (e: any) {
      setNativeLogs(prev => [...prev, `Bridge Error: ${e.message}`]);
    }
  };

  const stopScript = async () => {
    await MacroBridge.stopMacro();
    setScriptStatus('stopped');
  };

  return (
    <div className="bg-[#1a1b1e] border border-[#2a2b30] rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-[#2a2b30] pb-2">
        <h3 className="text-sm font-bold text-white">Native Android Bridge</h3>
        <span className={`text-xs px-2 py-1 rounded ${scriptStatus === 'running' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
          {scriptStatus.toUpperCase()}
        </span>
      </div>

      {/* Permission Status Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className={`p-2 rounded text-center border ${isAccessibilityOn ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
          Accessibility<br/>{isAccessibilityOn ? 'ON' : 'OFF'}
        </div>
        <div className={`p-2 rounded text-center border ${isOverlayOn ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
          Overlay<br/>{isOverlayOn ? 'ON' : 'OFF'}
        </div>
        <div className={`p-2 rounded text-center border ${isCaptureOn ? 'border-green-500 text-green-400' : 'border-red-500 text-red-400'}`}>
          Capture<br/>{isCaptureOn ? 'ON' : 'OFF'}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button onClick={requestPermissions} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-semibold">
          1. Grant Perms
        </button>
        <button onClick={startCapture} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded font-semibold">
          2. Screen Capture
        </button>
        <button onClick={toggleOverlay} className={`flex-1 py-2 rounded font-semibold text-white ${isOverlayOn ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'}`}>
          {isOverlayOn ? 'Stop Overlay' : 'Start Overlay'}
        </button>
      </div>

      {/* Script Editor & Controls */}
      <div className="space-y-2">
        <textarea
          value={scriptCode}
          onChange={(e) => setScriptCode(e.target.value)}
          className="w-full h-24 bg-[#0b0c10] text-[#0f0] font-mono text-xs p-2 rounded border border-[#2a2b30]"
          placeholder="Paste your Javascript here..."
        />
        <div className="flex gap-2">
          <button onClick={runScript} disabled={scriptStatus === 'running'} className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-2 rounded font-semibold text-sm">
            ▶ RUN SCRIPT
          </button>
          <button onClick={stopScript} disabled={scriptStatus !== 'running'} className="flex-1 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white py-2 rounded font-semibold text-sm">
            ⏹ STOP
          </button>
        </div>
      </div>

      {/* Internal Live Logs */}
      <div className="bg-black rounded p-2 h-32 overflow-y-auto font-mono text-[10px] text-gray-400">
        {nativeLogs.length === 0 ? "Waiting for native logs..." : nativeLogs.map((log, i) => <div key={i}>{log}</div>)}
      </div>
    </div>
  );
};
