/* OBS Studio 32 — hi-fi DOM recreation (dark theme), modeled on the user's screenshot.
   Registers window.OBSStudio. Props: recording (bool), recTime ("00:00:00"),
   recordGlow (bool, highlights Start Recording), children → canvas content. */
(function () {
  const C = {
    win: '#171718', head: '#1f2022', dock: '#232427', list: '#1b1c1e', sel: '#22405c',
    canvas: '#343639', border: '#0e0e0f', line: '#2e3033',
    text: '#dee0e2', dim: '#9fa3a8', faint: '#6b6f75',
    btn: '#26282c', blue: '#6ea8dc', red: '#e0342f',
  };
  const F = "'Segoe UI', system-ui, -apple-system, sans-serif";
  const Ic = ({ d, s = 12, c = 'currentColor' }) => (
    <svg width={s} height={s} viewBox="0 0 12 12" style={{ display: 'block', color: c, flexShrink: 0 }}>{d}</svg>
  );
  const P = {
    plus: <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" fill="none" />,
    trash: <path d="M2 3.5h8M4.5 3.5V2h3v1.5M3 3.5l.6 7h4.8l.6-7M5 5.5v3.5M7 5.5v3.5" stroke="currentColor" strokeWidth="0.9" fill="none" />,
    up: <path d="M6 10.5V2M2.8 5.2 6 2l3.2 3.2" stroke="currentColor" strokeWidth="1.3" fill="none" />,
    down: <path d="M6 1.5V10M2.8 6.8 6 10l3.2-3.2" stroke="currentColor" strokeWidth="1.3" fill="none" />,
    dup: <g stroke="currentColor" strokeWidth="0.9" fill="none"><rect x="1.5" y="3.5" width="7" height="7" /><path d="M3.5 1.5h7v7" /></g>,
    gear: <g stroke="currentColor" strokeWidth="1.1" fill="none"><circle cx="6" cy="6" r="2.1" /><path d="M6 .8v2M6 9.2v2M.8 6h2M9.2 6h2M2.3 2.3l1.4 1.4M8.3 8.3l1.4 1.4M9.7 2.3 8.3 3.7M3.7 8.3 2.3 9.7" /></g>,
    eye: <g stroke="currentColor" strokeWidth="0.9" fill="none"><path d="M1 6c1.6-2.4 3.3-3.5 5-3.5S9.4 3.6 11 6c-1.6 2.4-3.3 3.5-5 3.5S2.6 8.4 1 6z" /><circle cx="6" cy="6" r="1.5" /></g>,
    eyeOff: <g stroke="currentColor" strokeWidth="0.9" fill="none"><path d="M1 6c1.6-2.4 3.3-3.5 5-3.5S9.4 3.6 11 6c-1.6 2.4-3.3 3.5-5 3.5S2.6 8.4 1 6z" opacity=".55" /><path d="M1.5 10.5l9-9" /></g>,
    lock: <g stroke="currentColor" strokeWidth="0.9" fill="none"><rect x="3" y="5.5" width="6" height="5" /><path d="M4.2 5.5V4a1.8 1.8 0 0 1 3.6 0v1.5" /></g>,
    mic: <g stroke="currentColor" strokeWidth="0.9" fill="none"><rect x="4.4" y="1.2" width="3.2" height="5.6" rx="1.6" /><path d="M2.8 5.8a3.2 3.2 0 0 0 6.4 0M6 9v2M4.5 11h3" /></g>,
    cam: <g stroke="currentColor" strokeWidth="0.9" fill="none"><rect x="1" y="3" width="7" height="6" rx="1" /><path d="M8 5.5 11 4v4L8 6.5z" /></g>,
    disp: <g stroke="currentColor" strokeWidth="0.9" fill="none"><rect x="1" y="2" width="10" height="6.5" /><path d="M4.5 10.5h3M6 8.5v2" /></g>,
    filt: <g stroke="currentColor" strokeWidth="0.9" fill="none"><path d="M1.5 2.5h9L7 6.8v3.4l-2-1V6.8z" /></g>,
    dots: <g fill="currentColor"><circle cx="6" cy="2.2" r="1" /><circle cx="6" cy="6" r="1" /><circle cx="6" cy="9.8" r="1" /></g>,
    spk: <g stroke="currentColor" strokeWidth="0.9" fill="none"><path d="M1.5 4.5h2L6.5 2v8L3.5 7.5h-2z" /><path d="M8 4a3 3 0 0 1 0 4M9.6 2.6a5.2 5.2 0 0 1 0 6.8" /></g>,
  };
  const Logo = ({ s = 16 }) => (
    <svg width={s} height={s} viewBox="0 0 100 100" style={{ display: 'block', flexShrink: 0 }}>
      <circle cx="50" cy="50" r="48" fill="#0c0d10" stroke="#3a3d42" strokeWidth="1.5" />
      <g fill="#d8dbe0">
        {[0, 120, 240].map(r => <path key={r} d="M50.00 13.00 L51.51 13.03 L53.01 13.13 L54.51 13.30 L55.99 13.54 L57.46 13.85 L58.92 14.22 L60.36 14.66 L61.77 15.17 L63.15 15.74 L64.50 16.38 L65.82 17.08 L67.10 17.84 L68.34 18.66 L69.53 19.54 L70.68 20.47 L71.78 21.45 L72.82 22.48 L73.81 23.56 L74.74 24.67 L75.62 25.83 L76.43 27.03 L77.17 28.26 L77.85 29.52 L78.47 30.80 L79.01 32.11 L79.49 33.43 L79.89 34.77 L80.23 36.12 L80.49 37.48 L80.68 38.83 L80.80 40.19 L80.84 41.54 L80.82 42.88 L80.73 44.21 L80.56 45.52 L80.33 46.81 L80.03 48.08 L79.67 49.31 L79.24 50.51 L78.75 51.67 L78.21 52.80 L77.60 53.88 L76.95 54.91 L76.24 55.90 L75.48 56.83 L74.68 57.70 L73.84 58.52 L72.96 59.27 L72.04 59.97 L71.10 60.60 L70.13 61.16 L69.13 61.65 L68.12 62.07 L67.10 62.42 L66.07 62.71 L65.03 62.91 L63.99 63.05 L62.96 63.11 L61.94 63.10 L60.93 63.02 L60.93 63.02 L61.58 62.71 L62.21 62.35 L62.82 61.96 L63.41 61.52 L63.98 61.05 L64.52 60.55 L65.04 60.02 L65.53 59.45 L65.99 58.86 L66.42 58.25 L66.83 57.61 L67.21 56.95 L67.56 56.28 L67.88 55.58 L68.18 54.87 L68.45 54.15 L68.69 53.41 L68.90 52.66 L69.09 51.89 L69.25 51.12 L69.39 50.34 L69.51 49.55 L69.60 48.74 L69.66 47.93 L69.70 47.11 L69.72 46.29 L69.72 45.45 L69.69 44.60 L69.64 43.74 L69.57 42.88 L69.47 42.00 L69.35 41.11 L69.20 40.22 L69.03 39.31 L68.83 38.39 L68.60 37.45 L68.34 36.51 L68.05 35.55 L67.73 34.59 L67.37 33.61 L66.98 32.62 L66.55 31.62 L66.08 30.61 L65.57 29.59 L65.01 28.56 L64.41 27.52 L63.76 26.49 L63.06 25.44 L62.30 24.40 L61.49 23.35 L60.63 22.31 L59.70 21.27 L58.72 20.24 L57.67 19.22 L56.56 18.21 L55.39 17.20 L54.15 16.21 L52.84 15.21 L51.46 14.19 L50.00 13.00 Z" transform={'rotate(' + r + ' 50 50)'} />)}
      </g>
    </svg>
  );
  const Head = ({ label }) => (
    <div style={{ height: 24, background: C.head, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0, borderBottom: '1px solid ' + C.border }}>
      <span style={{ fontSize: 11.5, color: C.dim, whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ position: 'absolute', right: 8, top: 8, width: 8, height: 8, border: '1px solid ' + C.faint, borderTopWidth: 2 }} />
    </div>
  );
  const Tool = ({ items }) => (
    <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 3, padding: '0 8px', borderTop: '1px solid ' + C.border, flexShrink: 0 }}>
      {items.map((d, i) => d === '|' ? <span key={i} style={{ width: 8 }} />
        : <span key={i} style={{ width: 24, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim }}><Ic d={P[d]} /></span>)}
    </div>
  );
  const Btn = ({ children, glow, style }) => (
    <div style={{
      background: C.btn, color: C.text, fontSize: 13, height: 36, display: 'flex', alignItems: 'center',
      justifyContent: 'center', gap: 8, flexShrink: 0, whiteSpace: 'nowrap',
      border: '1px solid ' + (glow ? '#5a9bd5' : 'transparent'),
      boxShadow: glow ? '0 0 0 1px #5a9bd5, 0 0 16px rgba(90,155,213,.5)' : 'none', ...style,
    }}>{children}</div>
  );
  const Meter = ({ name, db, level, vol }) => (
    <div style={{ display: 'flex', flexDirection: 'column', width: 104, minHeight: 0, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: C.text, whiteSpace: 'nowrap' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span> <span style={{ color: C.faint, fontSize: 9 }}>▾</span>
      </div>
      <div style={{ fontSize: 11, color: C.dim, margin: '3px 0 5px' }}>{db} dB</div>
      <div style={{ display: 'flex', gap: 4, flex: 1, minHeight: 0 }}>
        <div style={{ width: 14, position: 'relative', flexShrink: 0 }}>
          <div style={{ position: 'absolute', left: 5, top: 0, bottom: 0, width: 3, background: '#101113' }} />
          <div style={{ position: 'absolute', left: 1, top: ((1 - vol) * 90) + '%', width: 12, height: 18, background: '#e4e7eb', borderRadius: 2, boxShadow: '0 1px 2px rgba(0,0,0,.6)' }} />
        </div>
        {[0.92, 1].map((k, i) => (
          <div key={i} style={{ width: 7, position: 'relative', background: '#101113', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #2e7d32 0%, #43a047 55%, #fdd835 82%, #e53935 94%)', opacity: 0.3 }} />
            <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: (level * k * 100) + '%', background: 'linear-gradient(to top, #2e7d32 0%, #43a047 55%, #fdd835 82%, #e53935 94%)', backgroundSize: '100% ' + (100 / Math.max(level * k, 0.01)) + '%', backgroundPosition: 'bottom' }} />
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', width: 20, fontSize: 7.5, color: C.faint, fontFamily: 'ui-monospace,monospace', padding: '1px 0' }}>
          {[0, -6, -12, -18, -24, -30, -36, -42, -48, -54, -60].map(n => <span key={n}>{n}</span>)}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 22, color: C.dim, marginTop: 3 }}>
        <Ic d={P.spk} /><Ic d={P.gear} s={11} />
      </div>
    </div>
  );
  const SrcRow = ({ icon, name, hidden }) => (
    <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', color: C.text, fontSize: 12.5 }}>
      <span style={{ color: C.dim }}><Ic d={P[icon]} /></span>
      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: hidden ? C.faint : C.text }}>{name}</span>
      <span style={{ color: C.dim }}><Ic d={hidden ? P.eyeOff : P.eye} /></span>
      <span style={{ color: C.faint }}><Ic d={P.lock} s={11} /></span>
    </div>
  );

  window.OBSStudio = function OBSStudio(props) {
    const recording = !!props.recording;
    const recTime = props.recTime || '00:00:00';
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: C.win, fontFamily: F, overflow: 'hidden', border: '1px solid #000', boxSizing: 'border-box', userSelect: 'none' }}>
        {/* title bar */}
        <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 0 0 10', paddingLeft: 10, flexShrink: 0 }}>
          <Logo />
          <span style={{ fontSize: 12.5, color: C.text, whiteSpace: 'nowrap' }}>OBS 32.1.2 - Profile: Untitled - Scenes: Untitled</span>
          <span style={{ flex: 1 }} />
          {['min', 'max', 'x'].map(k => (
            <span key={k} style={{ width: 44, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.dim }}>
              <svg width="11" height="11" viewBox="0 0 11 11">
                {k === 'min' && <path d="M1 5.5h9" stroke="currentColor" strokeWidth="1" />}
                {k === 'max' && <rect x="1.5" y="1.5" width="8" height="8" stroke="currentColor" strokeWidth="1" fill="none" />}
                {k === 'x' && <path d="M1.5 1.5l8 8M9.5 1.5l-8 8" stroke="currentColor" strokeWidth="1" />}
              </svg>
            </span>
          ))}
        </div>
        {/* menu bar */}
        <div style={{ height: 26, display: 'flex', alignItems: 'center', paddingLeft: 6, flexShrink: 0, borderBottom: '1px solid ' + C.border }}>
          {['File', 'Edit', 'View', 'Docks', 'Profile', 'Scene Collection', 'Tools', 'Help'].map(m => (
            <span key={m} style={{ fontSize: 12.5, color: C.text, padding: '4px 9px', whiteSpace: 'nowrap' }}>{m}</span>
          ))}
        </div>
        {/* main */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* left docks */}
          <div style={{ width: 200, display: 'flex', flexDirection: 'column', background: C.dock, borderRight: '1px solid ' + C.border, flexShrink: 0, minHeight: 0 }}>
            <Head label="Scenes" />
            <div style={{ flex: 1.05, background: C.list, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ height: 26, display: 'flex', alignItems: 'center', padding: '0 10px', background: C.sel, color: '#fff', fontSize: 12.5 }}>Scene</div>
              <div style={{ height: 26, display: 'flex', alignItems: 'center', padding: '0 10px', color: C.text, fontSize: 12.5 }}>webcam_raw2</div>
            </div>
            <Tool items={['plus', 'trash', 'dup', '|', 'up', 'down']} />
            <Head label="Sources" />
            <div style={{ flex: 1, background: C.list, minHeight: 0, overflow: 'hidden' }}>
              <SrcRow icon="mic" name="webby" hidden />
              <SrcRow icon="cam" name="Webcam" hidden />
              <SrcRow icon="disp" name="DISPLAY" />
            </div>
            <Tool items={['plus', 'trash', 'gear', '|', 'up', 'down']} />
          </div>
          {/* canvas column */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
            <div style={{ flex: 1, position: 'relative', background: C.canvas, minHeight: 0, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: '50%', top: '66%', transform: 'translate(-50%,-50%)', width: 574, height: 323, background: '#0d0f13', border: '1px solid #050506', overflow: 'hidden' }}>
                {props.children || (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'repeating-linear-gradient(45deg, #0d0f13 0 14px, #10131a 14px 28px)' }}>
                    <span style={{ fontSize: 11, letterSpacing: '.18em', color: '#3d434e', textTransform: 'uppercase', fontFamily: 'ui-monospace,monospace' }}>display capture</span>
                  </div>
                )}
              </div>
            </div>
            {/* zoom row */}
            <div style={{ height: 22, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', fontSize: 11, color: C.faint, borderTop: '1px solid ' + C.border, flexShrink: 0, whiteSpace: 'nowrap' }}>
              <span>−</span><span style={{ color: C.dim }}>22%</span><span>+</span>
              <span style={{ width: 1, height: 12, background: C.line }} />
              <span>Scaled (574x323)</span><span style={{ fontSize: 8 }}>▾</span>
              <span style={{ flex: 1, height: 6, background: '#222326', borderRadius: 3 }}><span style={{ display: 'block', width: '38%', height: '100%', background: '#3a3d42', borderRadius: 3 }} /></span>
            </div>
            {/* source bar */}
            <div style={{ height: 40, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', background: C.dock, borderTop: '1px solid ' + C.border, flexShrink: 0 }}>
              <span style={{ fontSize: 12.5, color: C.dim, whiteSpace: 'nowrap' }}>No source selected</span>
              <span style={{ width: 1, height: 20, background: C.line }} />
              {[['gear', 'Properties'], ['filt', 'Filters']].map(([ic, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 7, background: C.btn, color: C.text, fontSize: 12.5, padding: '5px 12px', whiteSpace: 'nowrap' }}>
                  <Ic d={P[ic]} s={11} />{l}
                </div>
              ))}
            </div>
            {/* bottom docks */}
            <div style={{ height: 265, display: 'flex', borderTop: '1px solid ' + C.border, flexShrink: 0 }}>
              <div style={{ width: 415, display: 'flex', flexDirection: 'column', background: C.dock, borderRight: '1px solid ' + C.border, minWidth: 0, flexShrink: 0 }}>
                <Head label="Audio Mixer" />
                <div style={{ display: 'flex', gap: 22, padding: '0 0 0 12px', flexShrink: 0 }}>
                  {[0, 1].map(i => (
                    <span key={i} style={{ width: 104, display: 'flex' }}>
                      <span style={{ fontSize: 11, color: '#fff', background: '#2b5b8c', padding: '2px 13px 3px' }}>Global</span>
                    </span>
                  ))}
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 22, padding: '6px 12px 4px', minHeight: 0 }}>
                  <Meter name="Desktop Audio" db="-4.6" level={recording ? 0.58 : 0.34} vol={0.28} />
                  <Meter name="Mic/Aux" db="0.0" level={recording ? 0.42 : 0.18} vol={0.12} />
                </div>
                <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px', borderTop: '1px solid ' + C.border, fontSize: 11.5, color: C.dim, flexShrink: 0, whiteSpace: 'nowrap' }}>
                  <span>0 hidden</span><span style={{ flex: 1 }} /><Ic d={P.dup} s={11} /><Ic d={P.gear} s={11} /><span>Options</span><span style={{ fontSize: 8 }}>▾</span>
                </div>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.dock, borderRight: '1px solid ' + C.border, minWidth: 0 }}>
                <Head label="Scene Transitions" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.list, border: '1px solid ' + C.line, padding: '6px 10px', fontSize: 12.5, color: C.text }}>
                    Fade <span style={{ color: C.faint, fontSize: 9 }}>▾</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 12.5, color: C.dim, whiteSpace: 'nowrap' }}>Duration</span>
                    <div style={{ flex: 1, display: 'flex', background: C.list, border: '1px solid ' + C.line }}>
                      <span style={{ flex: 1, padding: '5px 10px', fontSize: 12.5, color: C.text }}>300 ms</span>
                      <span style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 6px', color: C.faint, fontSize: 7, lineHeight: 1.2, borderLeft: '1px solid ' + C.line }}><span>▲</span><span>▼</span></span>
                    </div>
                  </div>
                  <span style={{ flex: 1 }} />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, color: C.dim }}>
                    {['plus', 'trash', 'dots'].map(d => (
                      <span key={d} style={{ width: 26, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.btn }}><Ic d={P[d]} s={11} /></span>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ width: 530, display: 'flex', flexDirection: 'column', background: C.dock, flexShrink: 0 }}>
                <Head label="Controls" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 10px' }}>
                  <Btn>Start Streaming</Btn>
                  <Btn glow={props.recordGlow} style={recording ? { color: '#ffb3b0', border: '1px solid #7e2c29' } : null}>
                    {recording ? 'Stop Recording' : 'Start Recording'}
                    {recording && <span style={{ width: 8, height: 8, borderRadius: '50%', background: C.red, boxShadow: '0 0 8px rgba(224,52,47,.9)' }} />}
                  </Btn>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Btn style={{ flex: 1 }}>Start Virtual Camera</Btn>
                    <Btn style={{ width: 40 }}><Ic d={P.gear} /></Btn>
                  </div>
                  <Btn>Studio Mode</Btn>
                  <Btn>Settings</Btn>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* status bar */}
        <div style={{ height: 24, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 18, padding: '0 14px', fontSize: 11.5, color: C.dim, borderTop: '1px solid ' + C.border, flexShrink: 0, whiteSpace: 'nowrap' }}>
          <span style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
            {[4, 7, 10].map(h => <span key={h} style={{ width: 3, height: h, background: C.faint }} />)}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3a3d42' }} />00:00:00
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: recording ? '#ff8985' : C.dim }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: recording ? C.red : '#3a3d42', boxShadow: recording ? '0 0 8px rgba(224,52,47,.9)' : 'none' }} />
            {recording ? recTime : '00:00:00'}
          </span>
          <span>CPU: 0.7%</span>
          <span>60.00 / 60.00 FPS</span>
          <span style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 3px)', gap: 2, transform: 'rotate(0deg)' }}>
            {[0, 0, 1, 0, 1, 1].map((v, i) => <span key={i} style={{ width: 2, height: 2, background: v ? C.faint : 'transparent' }} />)}
          </span>
        </div>
      </div>
    );
  };
})();
