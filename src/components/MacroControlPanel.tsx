import { useEffect } from 'react';
import { useMacroBridge } from '../hooks/useMacroBridge';

export function MacroControlPanel() {
  const {
    bridge, state, log, refresh,
    requestAll, requestCapture, startOverlay, stopOverlay,
    runScript, stopMacro, checkPixel,
  } = useMacroBridge();

  useEffect(() => {
    if (bridge) refresh();
  }, [bridge, refresh]);

  const demoScript = `
    MacroHost.tap(540, 960, 50);
    MacroHost.sleep(500);
    var c = MacroHost.getPixel(540, 1200);
    if (c !== 0) {
      var hit = MacroHost.findColor(400, 1000, 700, 1400, -65536, 30);
      if (hit !== -1) {
        var x = (hit >> 16) & 0xFFFF;
        var y = hit & 0xFFFF;
        MacroHost.tap(x, y, 40);
      }
    }
  `;

  const badge = (ok: boolean, label: string) => (
    <span style={{
      display: 'inline-block', padding: '2px 8px', marginRight: 6,
      borderRadius: 4, fontSize: 12,
      background: ok ? '#1a3d2a' : '#3d1a1a',
      color: ok ? '#4ade80' : '#f87171',
    }}>
      {label}: {ok ? 'OK' : 'NO'}
    </span>
  );

  return (
    <div style={{ padding: 16, border: '1px solid #333', borderRadius: 8, marginTop: 16 }}>
      <h3 style={{ marginTop: 0 }}>Native Macro Bridge</h3>

      {!bridge && (
        <p style={{ color: '#fbbf24' }}>
          MacroBridge plugin not detected — running in browser preview.
          Install the APK to test native features.
        </p>
      )}

      <div style={{ marginBottom: 12 }}>
        {badge(state.accessibility, 'Accessibility')}
        {badge(state.overlay, 'Overlay')}
        {badge(state.screenCapture, 'Screen Capture')}
        {badge(state.ready, 'Ready')}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={requestAll} disabled={!bridge}>Request Permissions</button>
        <button onClick={requestCapture} disabled={!bridge}>Enable Screen Capture</button>
        <button onClick={startOverlay} disabled={!bridge}>Start Overlay Pill</button>
        <button onClick={stopOverlay} disabled={!bridge}>Stop Overlay Pill</button>
        <button onClick={() => runScript(demoScript)} disabled={!bridge || !state.ready}>
          Run Demo Macro
        </button>
        <button onClick={stopMacro} disabled={!bridge}>Stop Macro</button>
        <button onClick={() => checkPixel(540, 1200)} disabled={!bridge || !state.screenCapture}>
          Read Pixel (540,1200)
        </button>
        <button onClick={refresh} disabled={!bridge}>Refresh Status</button>
      </div>

      <pre style={{
        marginTop: 12, padding: 8, background: '#0a0a0a', color: '#4ade80',
        fontSize: 11, maxHeight: 200, overflow: 'auto', borderRadius: 4,
      }}>
        {log.length ? log.join('\n') : 'No log output yet.'}
      </pre>
    </div>
  );
}
