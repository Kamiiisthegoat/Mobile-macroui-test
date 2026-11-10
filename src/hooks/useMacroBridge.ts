import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      Plugins: {
        MacroBridge: MacroBridgeApi;
      };
    };
  }
}

export interface PermissionState {
  accessibility: boolean;
  overlay: boolean;
  screenCapture: boolean;
  ready: boolean;
}

export interface MacroBridgeApi {
  isReady(): Promise<PermissionState>;
  requestAllPermissions(): Promise<{ accessibility: boolean; overlay: boolean }>;
  openAccessibilitySettings(): Promise<void>;
  openOverlaySettings(): Promise<void>;
  requestScreenCapture(): Promise<{ started: boolean; alreadyRunning?: boolean }>;
  startOverlay(): Promise<{ running: boolean }>;
  stopOverlay(): Promise<{ running: boolean }>;
  executeQuickJs(opts: { script: string }): Promise<{ result: string }>;
  stopMacro(): Promise<void>;
  testTap(opts: { x: number; y: number }): Promise<{ dispatched: boolean }>;
  checkPixelNow(opts: { x: number; y: number }): Promise<{ color: number }>;
}

export function useMacroBridge() {
  const [bridge, setBridge] = useState<MacroBridgeApi | null>(null);
  const [state, setState] = useState<PermissionState>({
    accessibility: false,
    overlay: false,
    screenCapture: false,
    ready: false,
  });
  const [log, setLog] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setLog((prev) => [...prev.slice(-19), line]);
  }, []);

  useEffect(() => {
    // Capacitor injects window.Capacitor before React mounts,
    // but a small retry loop protects against slow bridges.
    let tries = 0;
    const timer = setInterval(() => {
      const api = window.Capacitor?.Plugins?.MacroBridge;
      if (api) {
        setBridge(api);
        clearInterval(timer);
      } else if (++tries > 20) {
        clearInterval(timer);
        appendLog('Plugin unavailable (running in browser?)');
      }
    }, 100);
    return () => clearInterval(timer);
  }, [appendLog]);

  const refresh = useCallback(async () => {
    if (!bridge) return;
    try {
      setState(await bridge.isReady());
    } catch (e) {
      appendLog(`isReady failed: ${e}`);
    }
  }, [bridge, appendLog]);

  const requestAll = useCallback(async () => {
    if (!bridge) return;
    appendLog('Requesting permissions…');
    try {
      const r = await bridge.requestAllPermissions();
      appendLog(`Permissions: accessibility=${r.accessibility} overlay=${r.overlay}`);
      setTimeout(refresh, 1500); // user just left for Settings; re-check after return
    } catch (e) {
      appendLog(`requestAllPermissions failed: ${e}`);
    }
  }, [bridge, appendLog, refresh]);

  const requestCapture = useCallback(async () => {
    if (!bridge) return;
    appendLog('Requesting screen capture…');
    try {
      const r = await bridge.requestScreenCapture();
      appendLog(`Screen capture started: ${r.started}`);
      setTimeout(refresh, 800);
    } catch (e) {
      appendLog(`requestScreenCapture failed: ${e}`);
    }
  }, [bridge, appendLog, refresh]);

  const startOverlay = useCallback(async () => {
    if (!bridge) return;
    try {
      const r = await bridge.startOverlay();
      appendLog(`Overlay running: ${r.running}`);
    } catch (e) {
      appendLog(`startOverlay failed: ${e}`);
    }
  }, [bridge, appendLog]);

  const stopOverlay = useCallback(async () => {
    if (!bridge) return;
    try {
      await bridge.stopOverlay();
      appendLog('Overlay stopped');
    } catch (e) {
      appendLog(`stopOverlay failed: ${e}`);
    }
  }, [bridge, appendLog]);

  const runScript = useCallback(async (script: string) => {
    if (!bridge) return;
    appendLog('Executing QuickJS macro…');
    try {
      const r = await bridge.executeQuickJs({ script });
      appendLog(`Result: ${r.result}`);
    } catch (e) {
      appendLog(`executeQuickJs failed: ${e}`);
    }
  }, [bridge, appendLog]);

  const stopMacro = useCallback(async () => {
    if (!bridge) return;
    try {
      await bridge.stopMacro();
      appendLog('Macro stopped');
    } catch (e) {
      appendLog(`stopMacro failed: ${e}`);
    }
  }, [bridge, appendLog]);

  const checkPixel = useCallback(async (x: number, y: number) => {
    if (!bridge) return null;
    try {
      const r = await bridge.checkPixelNow({ x, y });
      appendLog(`Pixel (${x},${y}) = 0x${(r.color >>> 0).toString(16).padStart(8, '0')}`);
      return r.color;
    } catch (e) {
      appendLog(`checkPixelNow failed: ${e}`);
      return null;
    }
  }, [bridge, appendLog]);

  return {
    bridge, state, log, refresh,
    requestAll, requestCapture, startOverlay, stopOverlay,
    runScript, stopMacro, checkPixel,
  };
      }
