/* Flowmaster UX story — continuous composition.
   Every visual is DOM/CSS so it survives video export (no WebGL). */

const { useComposition, CompositionStage, Easing, animate, clamp, useTimeline } = window;

const MOTION = {
  enter: Easing.easeOutCubic,
  draw: Easing.easeInOutQuad,
  pop: Easing.easeOutBack,
};

const THEMES = {
  midnight: {
    bg0: '#0a0a0a', bg1: '#141414', bg2: '#1a1a1a', border: '#242424', border2: '#2a2a2a',
    text: '#e6e6e6', text2: '#8a8a8a', text3: '#6f6f6f', accent: '#ff3333',
    soft: 'rgba(255,51,51,.13)', accentText: '#ff6b6b', title: '#182ea1', blue: '#2a5a8a',
  },
  purple: {
    bg0: '#150d24', bg1: '#1e1033', bg2: '#2a1f4e', border: '#3d2d6b', border2: '#4a3880',
    text: '#f0e6ff', text2: '#a89cc4', text3: '#8579a8', accent: '#e94560',
    soft: 'rgba(233,69,96,.16)', accentText: '#ff8fa3', title: '#3d2d6b', blue: '#3f4f9e',
  },
  cobalt: {
    bg0: '#090c14', bg1: '#101524', bg2: '#181f34', border: '#24305a', border2: '#2d3b6b',
    text: '#e6eaf4', text2: '#8b96b8', text3: '#6d789c', accent: '#3970e5',
    soft: 'rgba(57,112,229,.18)', accentText: '#7ba4f5', title: '#1a2240', blue: '#3970e5',
  },
};

const STEPS = [
  ['Get set up', 'It’s time to get started!'],
  ['Open OBS Studio', 'Launch OBS like any other session.'],
  ['Start Flowmaster', 'Run Flowmaster — it finds OBS and connects on its own.'],
  ['Hit record', 'Click Start Recording in OBS. Flowmaster follows along.'],
  ['Then Just Play', 'Flowmaster sits in the tray while OBS records.'],
  ['Press your mark key', 'Hit F9 the moment something good happens, then keep playing.'],
  ['Stop recording', 'The finished session appears at the top of the Mark tab.'],
  ['Clip your videos', 'Adjust the lookback and lookforward windows — how much is kept before and after each mark.'],
  ['Edit your marks', 'Add, Remove, or Move your marks in the mark editor.'],
  ['Choose your output', 'One highlight reel, separate clips, or both at once.'],
  ['Extract', 'A stream copy pulls the ranges out — no re-encode, no quality loss.'],
  ['Make it yours', 'Change the colour theme or your mark key in Settings.'],
  ['Reclaim the space', 'Clean finds the originals you already pulled highlights from.'],
  ['Or take it to your editor', 'Project Assembler opens the footage with every mark on the timeline.'],
  ['Edit like normal', 'The same clip, loaded in your editor — your marks are already timeline markers.'],
];

/* ── tiny helpers ─────────────────────────────────────────────── */
const seg = (T, start, end, from, to, ease) =>
  animate({ from, to, start, end, ease: ease || MOTION.draw })(T);
const holdBetween = (T, a, b) => (T >= a && T < b ? 1 : 0);
const fmt = (n) => (n < 10 ? '0' + n : '' + n);
const mmss = (s) => Math.floor(s / 60) + ':' + fmt(Math.floor(s % 60));

/* ── CSS stand-ins for the WebGL presets ──────────────────────── */
/* ── ready gate: hold at start until both clips are fully buffered ─ */
function ReadyGate({ rootRef, needsVideo = true }) {
  const tl = useTimeline();
  const [buffered, setBuffered] = React.useState(false);
  const [prog, setProg] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const startRef = React.useRef(null);
  const [dismissed, setDismissed] = React.useState(false);
  const showReady = buffered && elapsed >= 2;
  React.useEffect(() => {
    if (!showReady) return;
    window.__fmReady = true;
    window.parent.postMessage({type:'flowmaster:ready'}, location.origin);
  }, [showReady]);
  /* minimum 2s sweep so a cached reload still shows the bar fill */
  React.useEffect(() => {
    if (showReady || dismissed) return;
    if (startRef.current === null) startRef.current = performance.now();
    const iv = setInterval(() => setElapsed((performance.now() - startRef.current) / 1000), 50);
    return () => clearInterval(iv);
  }, [showReady, dismissed]);
  const t0Ref = React.useRef(null);
  const ticksRef = React.useRef(0);
  React.useEffect(() => {
    if (buffered) return;
    if (!needsVideo) { setBuffered(true); return; }
    const iv = setInterval(() => {
      const vids = rootRef.current ? [...rootRef.current.querySelectorAll('video, audio')] : [];
      if (!vids.length) return;
      ticksRef.current++;
      let sum = 0, allReady = vids.length >= 3;
      vids.forEach(v => {
        const d = v.duration && isFinite(v.duration) ? v.duration : 0;
        const end = v.buffered && v.buffered.length ? v.buffered.end(v.buffered.length - 1) : 0;
        sum += d ? Math.min(1, end / d) : 0;
        if (!(v.readyState >= 4 || (d && end >= d - 0.75))) allReady = false;
      });
      setProg(p => Math.max(p, sum / vids.length));
      /* fallback: after ~14s, if everything is at least playable, call it ready */
      if (allReady || (ticksRef.current > 40 && vids.length >= 3 && vids.every(v => v.readyState >= 3))) setBuffered(true);
    }, 350);
    return () => clearInterval(iv);
  }, [buffered]);
  React.useEffect(() => {
    if (dismissed) return;
    if (tl.playing || tl.extPlaying) { setDismissed(true); return; }
    if (t0Ref.current === null) t0Ref.current = tl.time;
    else if (Math.abs(tl.time - t0Ref.current) > 0.01) setDismissed(true);
  }, [tl.playing, tl.extPlaying, tl.time, dismissed]);
  if (dismissed) return null;
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#07080b',
      fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <img src="assets/logo-horizontal-lockup.svg" alt="Flowmaster — Live Studio" style={{ width: 380, display: 'block', animation: 'fmfadeup .6s ease-out both' }} />
        <div style={{ fontSize: 17, fontWeight: 600, color: '#b6bcc6', letterSpacing: '.24em', textTransform: 'uppercase', animation: 'fmfadeup .6s ease-out .12s both' }}>How it works</div>
        {!showReady ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, animation: 'fmfadeup .6s ease-out .24s both' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, color: '#b6bcc6', fontSize: 17, fontVariantNumeric: 'tabular-nums' }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                border: '3px solid rgba(255,255,255,.18)', borderTopColor: '#ff3333',
                animation: 'fmspin .9s linear infinite',
              }} />
              Buffering footage + music… {Math.round(clamp(Math.min(elapsed / 2, buffered ? 1 : Math.max(prog, elapsed > 1 ? prog : elapsed / 2)), 0, 1) * 100)}%
            </div>
            <div style={{ width: 340, height: 6, borderRadius: 3, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}>
              <div style={{ width: (clamp(Math.min(elapsed / 2, buffered ? 1 : Math.max(prog, elapsed > 1 ? prog : elapsed / 2)), 0, 1) * 100) + '%', height: '100%', background: '#ff3333', borderRadius: 3 }} />
            </div>
          </div>
        ) : (
          <button type="button" aria-label="Play Flowmaster walkthrough"
            onClick={() => { window.__fmAudioOK = true; setDismissed(true); tl.setTime(0); tl.setPlaying(true); }}
            style={{
              border: 0, fontFamily: 'inherit', cursor: 'pointer', width: 420, boxSizing: 'border-box', display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 12, padding: 16, borderRadius: 8, background: '#ff3333',
              color: '#fff', fontSize: 19, fontWeight: 600, boxShadow: '0 12px 36px rgba(255,51,51,.3)',
              animation: 'fmfadeup .45s ease-out both',
            }}
          >
            <span style={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '13px solid #fff' }} />
            <span>Play</span>
            <span style={{ opacity: .75, fontWeight: 500 }}>· 1:49</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── real gameplay footage, clock-synced to the composition ──── */
function GameVideo({ src, T, offset = 0, vt = null, hold = false, volume = 0.65, style }) {
  const ref = React.useRef(null);
  const tl = useTimeline();
  const active = tl.playing || tl.extPlaying;
  const prevT = React.useRef(null);
  React.useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const d = v.duration && isFinite(v.duration) ? v.duration : 20;
    const want = vt != null ? clamp(vt, 0, d - 0.05) : clamp(T - offset, 0, d - 0.3);
    const atEnd = vt == null && T - offset >= d - 0.4;
    const last = prevT.current;
    const jumped = last === null || Math.abs(T - last) > 0.4;
    prevT.current = T;
    /* while playing, only correct on a scrub or gross drift so audio never chops */
    const tol = active ? (jumped ? 0.12 : 1.2) : 0.05;
    if (v.readyState >= 2 && !atEnd && Math.abs(v.currentTime - want) > tol) v.currentTime = want;
    v.muted = !window.__fmAudioOK;
    v.volume = clamp(volume, 0, 1) * 0.126; /* hard −18 dB pad on game audio */
    if (active && !atEnd && !hold) {
      if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
    } else if (!v.paused) v.pause();
  });
  return (
    <video ref={ref} src={src} muted playsInline preload="auto"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }} />
  );
}

/* ── flat mock game HUD, layered over the shader (webgl mode) ─── */
function GameHUD({ T, events = [] }) {
  const names = ['kzr_04', 'NOVA-9', 'patchwrk', 'M0RRIS', 'delta.wav'];
  const mono = 'ui-monospace,Menlo,monospace';
  const panel = { background: 'rgba(8,9,12,.62)', border: '1px solid rgba(255,255,255,.14)', borderRadius: 6 };
  const seen = events.filter(e => T >= e);
  let dmg = 0;
  events.forEach(e => {
    const p = clamp((T - (e - 0.9)) / 0.25, 0, 1) * clamp(1 - (T - (e - 0.9)) / 2.2, 0, 1);
    dmg = Math.max(dmg, p);
  });
  const health = Math.round(100 - 34 * dmg);
  const last = seen.length ? seen[seen.length - 1] : -99;
  const ammo = T - last < 1.6 ? 30 - clamp(Math.floor((T - (last - 0.9)) * 9), 0, 17) : 30;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', fontFamily: mono }}>
      <div style={{ position: 'absolute', left: 22, top: 20, width: 146, height: 146, overflow: 'hidden', ...panel }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 24px), repeating-linear-gradient(90deg, rgba(255,255,255,.05) 0 1px, transparent 1px 24px)' }} />
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            position: 'absolute',
            left: (50 + 30 * Math.sin(T * 0.4 + i * 2.1)) + '%',
            top: (50 + 30 * Math.cos(T * 0.31 + i * 1.7)) + '%',
            width: 7, height: 7, borderRadius: '50%', background: '#f4383c',
            boxShadow: '0 0 8px rgba(244,56,60,.8)', transform: 'translate(-50%,-50%)',
          }} />
        ))}
        <span style={{
          position: 'absolute', left: '50%', top: '50%', width: 0, height: 0,
          borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
          borderBottom: '11px solid #6be553',
          transform: `translate(-50%,-55%) rotate(${Math.sin(T * 0.6) * 40}deg)`,
        }} />
        <span style={{ position: 'absolute', left: '50%', top: 4, transform: 'translateX(-50%)', fontSize: 9, color: 'rgba(255,255,255,.5)', letterSpacing: '.1em' }}>N</span>
      </div>
      <div style={{ position: 'absolute', right: 22, top: 20, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        {seen.slice(-3).map(e => {
          const a = clamp((T - e) / 0.3, 0, 1) * clamp(1 - (T - e) / 4.5, 0, 1);
          return (
            <div key={e} style={{
              display: 'flex', gap: 8, alignItems: 'center', padding: '5px 10px', fontSize: 12, ...panel,
              opacity: a, transform: `translateX(${(1 - clamp((T - e) / 0.3, 0, 1)) * 16}px)`,
            }}>
              <span style={{ color: '#6be553', fontWeight: 700 }}>FLOW</span>
              <span style={{ color: '#f4383c' }}>▸</span>
              <span style={{ color: '#c9d1dc' }}>{names[events.indexOf(e) % names.length]}</span>
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: '50%', top: '47%', transform: 'translate(-50%,-50%)', width: 26, height: 26, opacity: .85 }}>
        {[[12, 0, 2, 7], [12, 19, 2, 7], [0, 12, 7, 2], [19, 12, 7, 2]].map(([l, t, w, h], i) => (
          <span key={i} style={{ position: 'absolute', left: l, top: t, width: w, height: h, background: '#fff' }} />
        ))}
        {(() => {
          /* hitmarker: red diagonals collapsing toward the reticle at each kill */
          let hm = 0;
          events.forEach(e => {
            const p = (T - (e - 0.12)) / 0.5;
            if (p > 0 && p < 1) hm = Math.max(hm, 1 - p);
          });
          if (hm <= 0) return null;
          const d = 9 + (1 - hm) * 7; /* distance from centre grows as it fades */
          return [45, 135, 225, 315].map(a => (
            <span key={a} style={{
              position: 'absolute', left: 12, top: 12, width: 3, height: 11,
              background: '#f4383c', borderRadius: 1, opacity: hm,
              boxShadow: '0 0 6px rgba(244,56,60,.8)',
              transform: `rotate(${a}deg) translateY(${-d - 11}px)`,
              transformOrigin: '50% 100%',
            }} />
          ));
        })()}
      </div>
      <div style={{ position: 'absolute', left: 22, bottom: 20, width: 250, padding: '10px 12px', boxSizing: 'border-box', ...panel }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,.65)', marginBottom: 6, letterSpacing: '.08em' }}>
          <span>HP</span>
          <span style={{ color: health > 70 ? '#6be553' : '#f5d440', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{health}</span>
        </div>
        <div style={{ height: 8, borderRadius: 2, background: '#1a1c22', overflow: 'hidden' }}>
          <div style={{ width: health + '%', height: '100%', background: health > 70 ? '#6be553' : '#f5d440' }} />
        </div>
        <div style={{ height: 4, borderRadius: 2, background: '#1a1c22', overflow: 'hidden', marginTop: 4 }}>
          <div style={{ width: '58%', height: '100%', background: '#f5d440', opacity: .8 }} />
        </div>
      </div>
      <div style={{ position: 'absolute', right: 22, bottom: 20, padding: '8px 14px', display: 'flex', alignItems: 'baseline', gap: 6, ...panel }}>
        <span style={{ fontSize: 26, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{ammo}</span>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,.5)' }}>/ 120</span>
      </div>
    </div>
  );
}

function PresetVisual({ preset, T, energy, style }) {
  const t = T;
  const base = { position: 'absolute', inset: 0, overflow: 'hidden', background: '#080808', ...style };
  if (preset === 'equalizer') {
    const bars = [];
    for (let i = 0; i < 26; i++) {
      const h = 14 + 78 * Math.abs(Math.sin(t * (1.1 + i * 0.09) + i * 0.7)) * (0.45 + energy * 0.55);
      const hue = i < 9 ? '#ff3333' : i < 18 ? '#f5d440' : '#6be553';
      bars.push(
        <div key={i} style={{
          flex: 1, height: h + '%', alignSelf: 'flex-end', background: hue,
          borderRadius: 2, opacity: 0.85, boxShadow: '0 0 14px ' + hue + '66',
        }} />
      );
    }
    return <div style={base}><div style={{ position: 'absolute', inset: '12% 8%', display: 'flex', gap: 4, alignItems: 'flex-end' }}>{bars}</div></div>;
  }
  if (preset === 'plasma') {
    const p = (a, b, c) => `radial-gradient(circle at ${50 + 34 * Math.sin(t * a + c)}% ${50 + 30 * Math.cos(t * b + c)}%, `;
    return <div style={{
      ...base,
      backgroundImage:
        p(0.31, 0.24, 0) + 'rgba(255,51,51,.55) 0%, rgba(255,51,51,0) 46%),' +
        p(0.22, 0.35, 2.1) + 'rgba(245,212,64,.5) 0%, rgba(245,212,64,0) 44%),' +
        p(0.27, 0.19, 4.2) + 'rgba(107,229,83,.42) 0%, rgba(107,229,83,0) 42%),' +
        p(0.17, 0.29, 1.1) + 'rgba(80,120,255,.34) 0%, rgba(80,120,255,0) 48%)',
      filter: 'blur(2px) saturate(1.15)',
    }} />;
  }
  if (preset === 'noise') {
    const rows = [];
    for (let i = 0; i < 30; i++) {
      const x = Math.sin(t * 0.8 + i * 1.7) * 22;
      const o = 0.18 + 0.55 * Math.abs(Math.sin(t * 0.6 + i));
      rows.push(<div key={i} style={{
        position: 'absolute', left: '-10%', right: '-10%', top: (i * 3.4) + '%', height: '2.2%',
        transform: `translateX(${x}px)`, background: `linear-gradient(90deg, rgba(255,51,51,0), rgba(245,212,64,${o}) 35%, rgba(107,229,83,${o}) 65%, rgba(107,229,83,0))`,
      }} />);
    }
    return <div style={base}>{rows}</div>;
  }
  /* flowmaster — the vertical red→yellow→green wave */
  const nodes = [];
  for (let i = 0; i < 30; i++) {
    const f = i / 29;
    const x = 50 + Math.sin(t * 1.05 + f * 5.4) * (7 + 10 * energy) + Math.sin(t * 0.5 + f * 2.1) * 4;
    const col = f < 0.42 ? '#6be553' : f < 0.66 ? '#f5d440' : '#ff3333';
    nodes.push(<div key={i} style={{
      position: 'absolute', left: x + '%', top: (f * 100) + '%', width: 26 + 22 * energy, height: '5%',
      transform: 'translate(-50%,-50%)', borderRadius: 999, background: col,
      filter: 'blur(9px)', opacity: 0.55 + 0.45 * energy,
    }} />);
  }
  return <div style={base}>{nodes}</div>;
}

/* ── app chrome ───────────────────────────────────────────────── */
const SectionTitle = ({ c, children }) => (
  <div style={{
    fontSize: 11, color: c.text3, textTransform: 'uppercase', letterSpacing: '.14em',
    fontWeight: 700, marginBottom: 10,
  }}>{children}</div>
);

const Pill = ({ c, children }) => (
  <span style={{
    background: c.soft, color: c.accentText, padding: '1px 7px', borderRadius: 999,
    fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
  }}>{children}</span>
);

const Thumb = ({ c, dur }) => (
  <div style={{
    position: 'relative', width: 64, height: 36, flexShrink: 0, borderRadius: 4, overflow: 'hidden',
    border: '1px solid ' + c.border2,
    background: 'repeating-linear-gradient(135deg,#151515 0 6px,#1c1c1c 6px 12px)',
  }}>
    <span style={{
      position: 'absolute', right: 3, bottom: 2, fontFamily: 'ui-monospace,Menlo,monospace',
      fontSize: 9, color: '#d0d0d0', background: 'rgba(0,0,0,.65)', padding: '0 3px', borderRadius: 2,
    }}>{dur}</span>
  </div>
);

function MarkTab({ c, T, sessions, railPreset, energy, newRowGlow, assemblerPress }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px',
        background: c.bg1, border: '1px solid ' + c.border, borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: c.text }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#33ff33', boxShadow: '0 0 6px #33ff33' }} />
          <span style={{ whiteSpace: 'nowrap' }}>OBS: Connected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {['#f4383c', '#f5d440', '#6be553'].map((col, i) => (
              <span key={i} style={{ width: 10, height: 10, borderRadius: 2, background: col, opacity: 0.6 }} />
            ))}
          </div>
          <span style={{
            fontSize: 11, fontFamily: 'monospace', letterSpacing: 1, fontWeight: 600, color: c.text2,
          }}>IDLE</span>
        </div>
      </div>

      <div>
        <SectionTitle c={c}>Recent Sessions</SectionTitle>
        <div style={{
          border: '1px solid ' + c.border, borderRadius: 8, background: c.bg1, padding: 6, overflow: 'hidden',
        }}>
          {sessions.map((s, i) => (
            <div key={s.filename} style={{
              display: 'flex', alignItems: 'center', padding: '12px 16px',
              borderBottom: i === sessions.length - 1 ? 'none' : '1px solid ' + c.border2,
              background: i === 0 && newRowGlow > 0 ? `rgba(255,51,51,${0.1 * newRowGlow})` : 'transparent',
              maxHeight: i === 0 ? s.reveal * 62 : 62,
              opacity: i === 0 ? s.reveal : 1,
              overflow: 'hidden',
            }}>
              <Thumb c={c} dur={s.dur} />
              <div style={{ flex: 1, minWidth: 0, marginLeft: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: c.text, whiteSpace: 'nowrap' }}>{s.filename}</span>
                  {i === 0 && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: '#fff', background: c.accent,
                      padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0,
                      boxShadow: newRowGlow > 0 ? `0 0 ${10 * newRowGlow}px rgba(255,51,51,.8)` : 'none',
                    }}>New</span>
                  )}
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 5, fontSize: 12,
                  color: c.text2, fontVariantNumeric: 'tabular-nums',
                }}>
                  <Pill c={c}>{s.marks}</Pill>
                  <span>{s.date}</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: 8 }}>
                {[0, 1, 2].map(k => <span key={k} style={{ width: 4, height: 4, borderRadius: '50%', background: c.text2 }} />)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <button data-focus-target="assembler" style={{
          width: '100%', boxSizing: 'border-box', padding: '1rem', background: c.accent, color: '#fff', border: 'none',
          borderRadius: 8, fontSize: 16, fontWeight: 600, fontFamily: 'inherit',
          transform: `scale(${assemblerPress ? 0.96 : 1})`,
          boxShadow: assemblerPress ? '0 0 0 3px rgba(255,255,255,.55), 0 0 24px rgba(255,51,51,.55)' : 'none',
        }}>Open Project Assembler</button>
      </div>

      <div style={{ padding: '12px 0', fontSize: 13, color: c.text2, textAlign: 'center' }}>
        Press <span style={{
          display: 'inline-block', padding: '2px 8px', background: c.bg2, border: '1px solid ' + c.border2,
          borderRadius: 4, fontFamily: 'monospace', fontSize: 12, color: '#ffcc00', fontWeight: 600,
        }}>F9</span> during recording to create timestamp markers.
      </div>
    </div>
  );
}

function ClipTab({ c, T, lookback, lookforward, reel, clips, extracting, extractPct, extractStage, selectedRow }) {
  const rows = [
    { date: 'Jul 27, 2026, 12:41 PM', marks: '3 marks', dur: '2:41:12', hi: '2:15', cam: true },
    { date: 'Jul 27, 2026, 12:19 PM', marks: '11 marks', dur: '0:21:48', hi: '8:15', cam: true },
    { date: 'Jul 14, 2026, 9:54 PM', marks: '1 mark', dur: '1:34:47', hi: '0:45', cam: false },
    { date: 'Jul 9, 2026, 7:02 PM', marks: '24 marks', dur: '3:11:07', hi: '18:00', cam: false },
  ];
  const total = Math.max(1, lookback + lookforward);
  /* bar spans the full adjustable range: −90s … +30s, so the mark sits at 75% */
  const markPct = 75;
  const lbPct = (lookback / 120) * 100;
  const lfPct = (lookforward / 120) * 100;
  const kept = (n) => mmss(Math.round(n * (lookback + lookforward) * 0.82));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 8 }}>
      <div>
        <SectionTitle c={c}>Clippable Videos</SectionTitle>
        <div style={{
          border: '1px solid ' + c.border, borderRadius: '8px 8px 0 0', borderBottom: 'none',
          background: c.bg1, padding: 4,
        }}>
          {rows.map((v, i) => {
            const on = selectedRow === i;
            const marks = parseInt(v.marks, 10);
            return (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                borderBottom: i === rows.length - 1 ? 'none' : '1px solid ' + c.border2,
                borderLeft: on ? '3px solid ' + c.accent : '3px solid transparent',
                background: on ? 'rgba(255,255,255,.02)' : 'transparent',
              }}>
                <span style={{
                  width: 18, height: 18, flexShrink: 0, border: '2px solid ' + (on ? c.accent : c.text2),
                  borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.accent, fontSize: 13, fontWeight: 700,
                }}>{on ? '✓' : ''}</span>
                <Thumb c={c} dur={v.dur} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: c.text, whiteSpace: 'nowrap' }}>{v.date}</span>
                    {i === 0 && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '.08em', color: '#fff', background: c.accent,
                        padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase', flexShrink: 0,
                      }}>New</span>
                    )}
                    <Pill c={c}>{v.marks}</Pill>
                    <span style={{
                      fontSize: 11, color: c.text3, border: '1px solid ' + c.border2,
                      borderRadius: 999, padding: '1px 7px', whiteSpace: 'nowrap',
                    }}>{v.cam ? 'gameplay + webcam' : 'gameplay only'}</span>
                  </div>
                  <div style={{ marginTop: 5, fontSize: 12, color: c.text2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                    {marks} ranges after merge · {kept(marks)} of {v.dur} kept
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 14px',
          border: '1px solid ' + c.border, borderTop: 'none', borderRadius: '0 0 8px 8px', background: c.bg1,
          fontSize: 12.8, color: c.text2,
        }}>
          <span>{selectedRow >= 0 ? '1 of 4 selected' : '4 videos'}</span>
          <span>Select All</span>
        </div>
      </div>

      <div style={{
        padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: c.bg1, border: '1px solid ' + c.border, borderRadius: 8,
      }}>
        <span style={{ fontSize: 14.4, fontWeight: 600, color: c.text }}>Source</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: c.text, whiteSpace: 'nowrap' }}>Marks</span>
          <span style={{
            position: 'relative', display: 'inline-block', width: 40, height: 22,
            borderRadius: 11, background: '#222', border: '1px solid ' + c.border2,
          }}>
            <span style={{
              position: 'absolute', left: 2, bottom: 2, width: 16, height: 16,
              borderRadius: '50%', background: c.text2,
            }} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 500, color: c.text2, whiteSpace: 'nowrap' }}>Auto-detect</span>
        </div>
      </div>

      <div data-focus-target="windows" style={{ padding: '12px 14px', background: c.bg1, border: '1px solid ' + c.border, borderRadius: 8 }}>
        <SectionTitle c={c}>Processing Options</SectionTitle>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 4 }}>
          {[['Lookback', lookback], ['Lookforward', lookforward]].map(([label, val]) => (
            <label key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14.4, color: c.text }}>
              {label}:
              <span style={{
                width: 60, padding: '6px 10px', background: 'rgba(255,255,255,.08)',
                border: '1px solid ' + c.border2, borderRadius: 6, fontSize: 13.6, textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}>{Math.round(val)}</span>
              sec
            </label>
          ))}
        </div>
        <div style={{
          margin: '10px 0 2px', padding: '10px 14px', background: c.bg0,
          border: '1px solid ' + c.border, borderRadius: 8,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '.12em',
            textTransform: 'uppercase', color: c.text3, marginBottom: 9,
          }}>
            <span>Window kept around every mark</span>
            <span style={{ color: c.text2, fontVariantNumeric: 'tabular-nums' }}>{Math.round(lookback + lookforward)}s per mark</span>
          </div>
          <div style={{ position: 'relative', height: 28, borderRadius: 5, background: '#171717', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: (markPct - lbPct) + '%', width: (lbPct + lfPct) + '%',
              background: 'rgba(255,51,51,.22)',
            }} />
            <div style={{
              position: 'absolute', top: 0, bottom: 0, left: markPct + '%', width: 2, marginLeft: -1,
              background: '#0a0a0a', boxShadow: '0 0 0 1px rgba(0,0,0,.6)',
            }} />
          </div>
          <div style={{
            position: 'relative', display: 'flex', justifyContent: 'space-between', marginTop: 7, fontSize: 11,
            color: c.text2, fontVariantNumeric: 'tabular-nums',
          }}>
            <span>−{Math.round(lookback)}s before</span>
            <span style={{ position: 'absolute', left: markPct + '%', transform: 'translateX(-50%)', color: c.accentText, fontWeight: 600 }}>mark</span>
            <span>+{Math.round(lookforward)}s after</span>
          </div>
        </div>
      </div>

      <div data-focus-target="output" style={{
        padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: c.bg1, border: '1px solid ' + c.border, borderRadius: 8,
      }}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ fontSize: 14.4, fontWeight: 600, color: c.text }}>Output Mode</span>
          <span style={{ fontSize: 11, color: c.text3, whiteSpace: 'nowrap' }}>
            {reel && clips ? 'One reel and separate clips' : reel ? 'One concatenated highlight reel' : 'Each highlight as its own file'}
          </span>
        </span>
        <div style={{ display: 'flex', gap: 18 }}>
          {[['Reel', reel], ['Clips', clips]].map(([label, on]) => (
            <span key={label} style={{
              padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
              background: on ? c.soft : 'transparent',
              border: '1px solid ' + (on ? c.accent : '#2f2f2f'),
              color: on ? '#ff8080' : c.text2,
            }}>{label}</span>
          ))}
        </div>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          width: '100%', boxSizing: 'border-box', padding: '12px 24px', borderRadius: 6, fontSize: 15.2, fontWeight: 600,
          color: '#fff', background: (extracting > 0.01 && extracting < 0.99) ? '#3d7cc2' : c.blue,
          textAlign: 'center', position: 'relative', overflow: 'hidden',
          opacity: selectedRow >= 0 ? 1 : 0.35,
          transform: `scale(${extracting > 0.01 && extracting < 0.99 ? 0.96 : 1})`,
          boxShadow: (extracting > 0.01 && extracting < 0.99) ? '0 0 0 3px rgba(255,255,255,.55), 0 0 24px rgba(74,158,255,.5)' : 'none',
        }}>
          {extracting > 0 && (
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: extractPct + '%', background: 'rgba(74,158,255,.38)' }} />
          )}
          {extracting > 0 ? (
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', fontVariantNumeric: 'tabular-nums' }}>
              <span style={{ whiteSpace: 'nowrap' }}>{extractStage}</span>
              <span>{Math.round(extractPct)}%</span>
            </div>
          ) : ('Clip Highlights · ' + (reel && clips ? 'reel + clips' : reel ? 'reel' : 'clips'))}
        </div>
        {extracting < 0.02 && (
          <div style={{ marginTop: 12, textAlign: 'center' }}>
            <div style={{
              width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: c.accent, color: '#fff',
              borderRadius: 8, fontSize: 15, fontWeight: 600, opacity: 0.5,
            }}>Assemble Highlights Project</div>
            <div style={{ marginTop: 5, fontSize: 12, color: c.text2 }}>
              Clip some videos first, then you can assemble them into a project
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CleanTab({ c, scan, results, purge, purgePress }) {
  const cats = [
    ['Processed Originals (Display)', '12 files', '84.2 GB', 'Highlights already extracted — originals safe to remove'],
    ['Processed Originals (Webcam)', '9 files', '11.6 GB', 'Webcam highlights already extracted — originals safe to remove'],
    ['Orphaned Webcam Recordings', '3 files', '2.4 GB', 'No matching display capture found — may be leftover'],
    ['Orphaned Timestamp Files', '5 files', '18 KB', 'No matching video file found — timestamp data is unused'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8, height: '100%' }}>
      <div style={{
        width: '100%', boxSizing: 'border-box', padding: '10px 16px', background: c.bg1, color: c.text,
        border: '1px solid ' + (scan > 0 && results < 1 ? c.accent : c.border), borderRadius: 8,
        fontSize: 14.4, fontWeight: 600, textAlign: 'center',
      }}>{scan > 0 && results < 1 ? 'Scanning…' : 'Scan for Removable Files'}</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {cats.map(([name, count, size, reason], i) => {
          const o = clamp((results - i * 0.13) * 3, 0, 1);
          const gone = clamp((purge - i * 0.16) * 4, 0, 1);
          return (
            <div key={name} style={{
              border: '1px solid ' + c.border, borderRadius: 8, background: c.bg1, overflow: 'hidden',
              opacity: o * (1 - gone), transform: `translateY(${(1 - o) * 10}px) translateX(${gone * 26}px)`,
              maxHeight: (1 - gone) * 84, marginBottom: gone * -8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
                <span style={{
                  width: 16, height: 16, border: '2px solid ' + c.accent, borderRadius: 3,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: c.accent, fontSize: 11, fontWeight: 700,
                }}>✓</span>
                <span style={{ fontSize: 12, color: c.text3 }}>▸</span>
                <span style={{ fontSize: 14.4, color: c.text, flex: 1, whiteSpace: 'nowrap' }}>{name}</span>
                <span style={{ display: 'flex', gap: 12, fontSize: 12.8, color: c.text2, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  <span>{count}</span>
                  <span style={{ color: c.text, fontWeight: 600 }}>{size}</span>
                </span>
              </div>
              <div style={{ padding: '0 12px 10px 34px', fontSize: 12, color: c.text3 }}>{reason}</div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', background: c.bg1, border: '1px solid ' + c.border, borderRadius: 8,
        opacity: clamp((results - 0.5) * 3, 0, 1),
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.6, color: c.text2, fontVariantNumeric: 'tabular-nums' }}>
          {purge >= 1 ? (
            <span style={{ color: '#6be553', fontWeight: 700, whiteSpace: 'nowrap' }}>✓ 29 files moved to Recycle Bin · Empty it to reclaim space</span>
          ) : (
            <React.Fragment>
              <span style={{ whiteSpace: 'nowrap' }}>29 selected</span><span style={{ color: '#555' }}>·</span>
              <span style={{ color: '#6be553', fontWeight: 700, whiteSpace: 'nowrap' }}>98.2 GB to free</span>
            </React.Fragment>
          )}
        </div>
        <div style={{
          padding: '10px 18px', background: c.accent, color: '#fff', borderRadius: 6,
          fontSize: 14.4, fontWeight: 600, whiteSpace: 'nowrap',
          opacity: purge >= 1 ? 0.4 : 1,
          transform: `scale(${purgePress ? 0.95 : 1})`,
          boxShadow: purgePress ? '0 0 0 3px rgba(255,255,255,.55), 0 0 22px rgba(255,51,51,.55)' : 'none',
        }}>{purge > 0 && purge < 1 ? 'Moving…' : 'Move to Recycle Bin'}</div>
      </div>
    </div>
  );
}

function SettingsPanel({ c, T, x, theme, hotkey, focusTheme, focusHotkey }) {
  const swatches = [
    ['midnight', '#e94560'], ['charcoal', '#2d2d2d'], ['purple', '#2a1f4e'], ['ocean', '#1b263b'],
    ['oled', '#000'], ['daylight', '#f5f6f8'], ['cobalt', '#3970e5'], ['arctic', '#0891b2'], ['dusk', '#8571b2'],
  ];
  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 600, background: c.bg0,
      borderLeft: '1px solid ' + c.border, display: 'flex', flexDirection: 'column',
      transform: `translateX(${x}px)`, boxShadow: '-24px 0 60px rgba(0,0,0,.5)', zIndex: 30,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px',
        borderBottom: '1px solid ' + c.border, background: c.bg2,
      }}>
        <div style={{ fontSize: 20, color: c.text, fontWeight: 600 }}>⚙ Settings</div>
        <div style={{ fontSize: 26, color: c.text2, lineHeight: 1 }}>×</div>
      </div>
      <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div style={{
          padding: focusHotkey > 0 ? 12 : 0, margin: focusHotkey > 0 ? -12 : 0, borderRadius: 8,
          background: focusHotkey > 0 ? 'rgba(255,255,255,.03)' : 'transparent',
          boxShadow: focusHotkey > 0 ? '0 0 0 1px ' + c.accent : 'none',
        }}>
          <SectionTitle c={c}>Hotkeys</SectionTitle>
          <div style={{ fontSize: 14, color: c.text, marginBottom: 8 }}>Mark Hotkey</div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{
              display: 'inline-block', padding: '8px 16px', background: c.bg2,
              border: '1px solid ' + (focusHotkey > 0 ? c.accent : c.border2), borderRadius: 4,
              fontFamily: 'monospace', fontSize: 16, fontWeight: 600, color: c.text,
            }}>{hotkey}</span>
            <span style={{
              padding: '8px 16px', background: c.bg2, border: '1px solid ' + c.border2,
              borderRadius: 4, color: c.text, fontSize: 14,
            }}>Change</span>
          </div>
        </div>

        <div style={{
          padding: focusTheme > 0 ? 12 : 0, margin: focusTheme > 0 ? -12 : 0, borderRadius: 8,
          background: focusTheme > 0 ? 'rgba(255,255,255,.03)' : 'transparent',
          boxShadow: focusTheme > 0 ? '0 0 0 1px ' + c.accent : 'none',
        }}>
          <SectionTitle c={c}>Appearance</SectionTitle>
          <div style={{ fontSize: 14, color: c.text, marginBottom: 10 }}>Color Theme</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {swatches.map(([name, col]) => {
              const on = name === theme;
              return <span key={name} style={{
                width: 26, height: 26, borderRadius: '50%', background: col,
                border: on ? '2px solid ' + c.accent : '1px solid #333',
                boxShadow: on ? '0 0 0 3px rgba(255,51,51,.25)' : 'none',
                transform: on ? 'scale(1.12)' : 'scale(1)',
              }} />;
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: c.text3 }}>
            Active: {theme.charAt(0).toUpperCase() + theme.slice(1)}
          </div>
        </div>

        <div>
          <SectionTitle c={c}>Processing</SectionTitle>
          <div style={{ fontSize: 14, color: c.text, marginBottom: 8 }}>Lookback (seconds before mark)</div>
          <span style={{
            display: 'inline-block', width: 100, padding: '8px 12px', background: c.bg2,
            border: '1px solid ' + c.border2, borderRadius: 6, fontSize: 14, color: c.text,
            textAlign: 'center', fontVariantNumeric: 'tabular-nums',
          }}>90</span>
        </div>
      </div>
    </div>
  );
}

function PlayerModal({ c, T, o, preset, presetName, playhead, t0, marks, jumpFlash, nextFlash, prevFlash, delToast, paused, zoom = 1, webgl }) {
  const liveMarks = marks.filter(m => m.del < 0.5);
  const markN = Math.max(1, liveMarks.filter(m => playhead >= m.pos - 0.5).length);
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o,
    }}>
      <div style={{
        width: 1080, height: 700, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        background: c.bg2, border: '1px solid ' + c.border2, borderRadius: 8,
        boxShadow: '0 24px 70px rgba(0,0,0,.65)',
        transform: `scale(${(0.97 + 0.03 * o) * zoom})`, transformOrigin: '63.5% 92%',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px',
          borderBottom: '1px solid ' + c.border2,
        }}>
          <div style={{
            fontSize: 15, fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', color: c.text,
          }}>Mark Editor</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{
              padding: '6px 14px', background: '#222', border: '1px solid ' + c.border2,
              borderRadius: 4, color: c.text, fontSize: 13,
            }}>Open…</span>
            <span style={{ fontSize: 24, color: c.text2, lineHeight: 1 }}>×</span>
          </div>
        </div>

        <div style={{ position: 'relative', flex: 1, background: '#000' }}>
          {webgl ? (
            <React.Fragment>
              <PresetVisual preset="plasma" T={4 + playhead * 0.2} energy={0.7} />
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(80% 70% at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,.45) 100%)' }} />
              <GameHUD T={4 + playhead * 0.2} events={[5.2, 7.4, 9.8, 11.6]} />
            </React.Fragment>
          ) : (
            <GameVideo src="uploads/2026-03-08 00-27-29_clip_005_0m12s-0m32s_1080p30.webm" T={T} offset={t0} vt={playhead * 0.2} hold={paused} volume={0.7 * o} />
          )}
          <div style={{
            position: 'absolute', left: 12, top: 12, padding: '4px 10px', borderRadius: 4,
            background: 'rgba(0,0,0,.55)', fontFamily: 'ui-monospace,Menlo,monospace',
            fontSize: 11, color: '#8ab4f8',
          }}>gameplay_2026-07-27_12-41-50.mkv · 2560x1440 · 60.000 fps</div>
          <div style={{
            position: 'absolute', right: 12, top: 12, padding: '4px 10px', borderRadius: 4,
            background: 'rgba(0,0,0,.55)', fontSize: 11, letterSpacing: '.12em',
            textTransform: 'uppercase', color: '#d8d8d8',
          }}>gameplay + webcam</div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 8, padding: '10px 12px', background: '#141414',
        }}>
          <div style={{ position: 'relative', height: 16 }}>
            <div style={{
              position: 'absolute', left: 0, right: 0, top: '50%', height: 4,
              transform: 'translateY(-50%)', background: '#3a3a3a', borderRadius: 2,
            }} />
            <div style={{
              position: 'absolute', left: 0, top: '50%', height: 4, width: playhead + '%',
              transform: 'translateY(-50%)', background: '#4a9eff', borderRadius: 2,
            }} />
            {marks.map(m => (
              <div key={m.pos} style={{
                position: 'absolute', left: m.pos + '%', top: '50%',
                width: m.hot ? 5 : 3, height: m.hot ? 16 : 12,
                transform: `translate(-50%,-50%) translateY(${m.del * -14}px) scale(${1 + m.del * 0.8})`,
                opacity: 1 - m.del,
                background: m.hot ? '#ff3333' : '#f0c040', borderRadius: 1,
                boxShadow: m.hot ? '0 0 0 3px rgba(255,51,51,.3), 0 0 12px rgba(255,51,51,.7)' : 'none',
              }} />
            ))}
            {delToast > 0 && (
              <div style={{
                position: 'absolute', left: '63.5%', bottom: 18, transform: 'translateX(-50%)',
                padding: '5px 12px', borderRadius: 5, background: '#2a1214', border: '1px solid rgba(255,51,51,.5)',
                color: '#ff8080', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', opacity: delToast,
              }}>Mark deleted</div>
            )}
            <div style={{
              position: 'absolute', left: playhead + '%', top: '50%', width: 12, height: 12,
              transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: '50%',
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {[(paused ? '▶' : '❚❚'), '⇤', '⇥'].map(g => {
              const hot = g === '⇥' && jumpFlash;
              return (
                <span key={g} style={{
                  minWidth: 32, height: 26, border: '1px solid ' + (hot ? c.accent : '#3a3a3a'),
                  background: hot ? c.soft : '#222',
                  color: hot ? '#ff8080' : '#eee', borderRadius: 4, fontSize: g === '❚❚' ? 10 : 13, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  boxShadow: hot ? '0 0 12px rgba(255,51,51,.45)' : 'none',
                }}>{g}</span>
              );
            })}
            <div style={{
              display: 'flex', gap: 12, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 11, color: '#bbb',
            }}>
              <span style={{ color: '#eee' }}>{'0' + Math.floor(playhead / 12) + ':' + fmt(Math.floor(playhead * 0.6)) + ':' + fmt(Math.floor(playhead * 2.4) % 60) + ':' + fmt(Math.floor(playhead * 5) % 60)}</span>
              <span>mark {markN} of {liveMarks.length}</span>
            </div>
            <span style={{ flex: 1 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AppWindow({ c, T, tab, children, railPreset, energy, presetLabel, railNext, railPrev }) {
  const tabStyle = (name) => ({
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '13px 24px',
    background: tab === name ? 'linear-gradient(' + c.bg2 + ',' + c.bg1 + ')' : 'none',
    borderBottom: '2px solid ' + (tab === name ? c.accent : 'transparent'),
    color: tab === name ? '#f0f0f0' : c.text2,
    fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.12em',
  });
  return (
    <div style={{
      width: 1240, height: 904, position: 'relative', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', borderRadius: 6, background: c.bg0, color: c.text,
      boxShadow: '0 30px 90px rgba(0,0,0,.75)', fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
    }}>
      <div style={{
        height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8,
        paddingLeft: 10, background: '#182ea1', color: '#fff',
      }}>
        <div style={{ display: 'flex', gap: 2 }}>
          {['#f4383c', '#f5d440', '#6be553'].map(col => (
            <span key={col} style={{ width: 4, height: 4, borderRadius: 1, background: col }} />
          ))}
        </div>
        <span style={{ fontSize: 12, whiteSpace: 'nowrap' }}>Flowmaster Beta 0.2.1</span>
        <span style={{ flex: 1 }} />
        {['—', '□', '✕'].map(g => (
          <span key={g} style={{
            width: 46, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
          }}>{g}</span>
        ))}
      </div>
      <div style={{
        minHeight: 52, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px',
        background: c.bg2, borderBottom: '1px solid ' + c.border2,
      }}>
        <span style={{ fontSize: 24, lineHeight: 1, color: c.text }}>☰</span>
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '.05em' }}>FLOWMASTER</span>
      </div>
      <div style={{ display: 'flex', flexShrink: 0, background: c.bg2, borderBottom: '1px solid ' + c.border2 }}>
        <div style={tabStyle('mark')}>MARK</div>
        <div style={tabStyle('clip')}>CLIP</div>
        <div style={tabStyle('clean')}>CLEAN</div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', padding: 16, background: c.bg0 }}>{children}</div>
        <div style={{
          width: 300, flexShrink: 0, borderLeft: '1px solid ' + c.border2, background: c.bg2,
          display: 'flex', flexDirection: 'column', gap: 12, padding: 16,
        }}>
          <div style={{ flex: 1, position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#0a0a0a' }}>
            <PresetVisual preset={railPreset} T={T} energy={energy} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <span style={{
              width: 32, height: 32, borderRadius: 4,
              border: '1px solid ' + (railPrev ? c.accent : c.border2),
              background: railPrev ? c.soft : c.bg2,
              boxShadow: railPrev ? '0 0 14px rgba(255,51,51,.45)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              color: railPrev ? '#ff8080' : c.text,
            }}>◀</span>
            <span style={{
              fontSize: 13, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase',
              minWidth: 120, textAlign: 'center', color: c.text,
            }}>{presetLabel}</span>
            <span style={{
              width: 32, height: 32, borderRadius: 4,
              border: '1px solid ' + (railNext ? c.accent : c.border2),
              background: railNext ? c.soft : c.bg2,
              boxShadow: railNext ? '0 0 14px rgba(255,51,51,.45)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              color: railNext ? '#ff8080' : c.text,
            }}>▶</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── the piece ────────────────────────────────────────────────── */
/* ── background music, clock-synced, −11 dB with −6 dB game-audio duck ─ */
function MusicTrack({ src, on, T, duck }) {
  const ref = React.useRef(null);
  const tl = useTimeline();
  const prevT = React.useRef(null);
  React.useEffect(() => {
    const a = ref.current;
    if (!a) return;
    /* −11 dB base, glide down −6 dB while game audio is present */
    a.volume = clamp(0.282 * Math.pow(0.501, clamp(duck, 0, 1)), 0, 1);
    a.muted = !window.__fmAudioOK;
    const d = a.duration && isFinite(a.duration) ? a.duration : 180;
    const want = ((T % d) + d) % d;
    const last = prevT.current;
    const jumped = last === null || Math.abs(T - last) > 0.4; /* scrub / loop wrap */
    prevT.current = T;
    const playing = on && (tl.playing || tl.extPlaying);
    if (!playing) {
      if (!a.paused) a.pause();
      if (a.readyState >= 1 && Math.abs(a.currentTime - want) > 0.25) a.currentTime = want;
      return;
    }
    /* once running, let the track play free — only resync on a real
       discontinuity or gross drift, so timing edits never chop the music */
    if (a.readyState >= 1 && (jumped || Math.abs(a.currentTime - want) > 3)) a.currentTime = want;
    if (a.paused) { const p = a.play(); if (p && p.catch) p.catch(() => {}); }
  });
  return <audio ref={ref} src={src} loop preload="auto" />;
}

function Piece({ webgl }) {
  const { T, CUES } = useComposition();
  const tlP = useTimeline();

  /* mark sound — fires with each F9 press */
  const markSndRef = React.useRef(null);
  const markFiredRef = React.useRef(-1);
  React.useEffect(() => {
    if (!markSndRef.current) {
      const a = new Audio('assets/sounds/mark-default.wav');
      a.preload = 'auto';
      markSndRef.current = a;
    }
  }, []);

  /* theme */
  const themeName = T < CUES.Settings + 2.4 ? 'midnight'
    : T < CUES.Settings + 4.3 ? 'purple'
      : T < CUES.Settings + 6.2 ? 'cobalt' : 'midnight';
  const c = THEMES[themeName];

  /* which step caption */
  const stepStarts = [CUES.Setup, CUES.OpenOBS, CUES.OpenFM, CUES.Record, CUES.Idle, CUES.Mark, CUES.Session, CUES.Windows, CUES.Player,
    CUES.Output, CUES.Extract, CUES.Settings, CUES.Clean, CUES.Assembler, CUES.Editor];
  let stepIdx = 0;
  stepStarts.forEach((s, i) => { if (T >= s - 0.001) stepIdx = i; });

  /* desktop → app transition */
  const gameIn = seg(T, CUES.Idle - 0.4, CUES.Idle + 1.0, 0, 1, MOTION.draw);
  const deskIn = seg(T, CUES.OpenOBS - 0.35, CUES.OpenOBS + 0.45, 0, 1, MOTION.draw);
  const gameOut = seg(T, CUES.Session - 0.2, CUES.Session + 1.1, 0, 1, MOTION.draw);
  const appIn = seg(T, CUES.Session + 0.25, CUES.Session + 1.4, 0, 1, MOTION.enter);

  /* marks during recording — keyed to the Idle scene so intro retimes don't move them */
  const markTimes = [CUES.Idle + 2.0, CUES.Idle + 4.7, CUES.Idle + 8.9];
  let markCount = 0;
  markTimes.forEach(t => { if (T >= t) markCount++; });
  const lastMark = markTimes.filter(t => T >= t).pop();
  const sinceMark = lastMark === undefined ? 99 : T - lastMark;
  const markFlash = clamp(1 - sinceMark / 1.1, 0, 1);
  React.useEffect(() => {
    if (T < markTimes[0] - 0.5) { markFiredRef.current = -1; return; }
    markTimes.forEach((t, i) => {
      if (T >= t && T - t < 0.35 && markFiredRef.current < i) {
        markFiredRef.current = i;
        const a = markSndRef.current;
        if (a && window.__fmAudioOK && (tlP.playing || tlP.extPlaying)) {
          a.currentTime = 0; a.volume = 0.8;
          const p = a.play(); if (p && p.catch) p.catch(() => {});
        }
      }
    });
  }, [T]);
  let keyO = 0;
  markTimes.forEach(t => {
    keyO = Math.max(keyO, clamp(
      seg(T, t - 0.6, t - 0.15, 0, 1, MOTION.enter) - seg(T, t + 1.3, t + 2.0, 0, 1, MOTION.draw), 0, 1));
  });
  const railEnergy = clamp(
    (T > CUES.Mark - 1 && T < CUES.Session + 0.6 ? 0.75 : 0.25) + markFlash * 0.5, 0, 1);

  /* tab routing */
  const tab = T < CUES.Windows ? 'mark'
    : T < CUES.Player ? 'clip'
      : T < CUES.Clean ? (T < CUES.Settings ? 'clip' : 'clip')
        : T < CUES.Assembler ? 'clean' : 'mark';

  /* step 4 — windows: raise lookback to 90, then trim it back down */
  let lookback = seg(T, CUES.Windows + 2.55, CUES.Windows + 4.3, 45, 75, MOTION.draw);
  if (T >= CUES.Windows + 4.8) lookback = seg(T, CUES.Windows + 4.8, CUES.Windows + 5.95, 75, 60, MOTION.draw);
  const lookforward = seg(T, CUES.Windows + 6.55, CUES.Windows + 7.65, 5, 12, MOTION.draw);

  /* step 8 — output mode: Clips only until the Reel pill is clicked */
  const reel = T >= CUES.Output + 2.0;
  const clips = true;

  /* step 6 — extract */
  const extracting = seg(T, CUES.Extract + 0.7, CUES.Extract + 1.1, 0, 1, MOTION.enter);
  const extractPct = clamp(seg(T, CUES.Extract + 1.0, CUES.Extract + 4.0, 0, 100, MOTION.draw), 0, 100);
  const extractStage = extractPct < 18 ? 'Probing streams'
    : extractPct < 42 ? 'Merging overlapping ranges'
      : extractPct < 82 ? 'Stream-copy extract · 31 ranges'
        : extractPct < 99 ? 'Writing highlight reel' : 'Done · 31 clips + 1 reel · 29:15';

  /* step 7 — player */
  const playerO = clamp(seg(T, CUES.Player + 0.3, CUES.Player + 1.0, 0, 1, MOTION.enter) -
    seg(T, CUES.Output - 0.9, CUES.Output - 0.3, 0, 1, MOTION.draw), 0, 1);
  /* player: playhead moves at true 1× speed (5%/s of the 20s clip) so video and handle stay locked */
  const playhead = (() => {
    let ph = clamp(4 + 5 * (T - (CUES.Player + 1.0)), 4, 39);
    if (T >= CUES.Player + 8.3) {
      const jump = seg(T, CUES.Player + 8.3, CUES.Player + 8.65, 39, 63.5, MOTION.draw);
      const replay = 5 * clamp(T - (CUES.Player + 8.65), 0, 1.75); /* replay from the mark, then pause */
      ph = jump + replay;
    }
    return clamp(ph, 0, 99);
  })();
  const pPaused = T >= CUES.Player + 10.4;
  /* zoom in on the timeline while the mark is deleted */
  const pZoom = 1 + 0.55 * clamp(seg(T, CUES.Player + 10.6, CUES.Player + 11.3, 0, 1, MOTION.enter) -
    seg(T, CUES.Player + 13.5, CUES.Player + 14.2, 0, 1, MOTION.draw), 0, 1);
  /* recap marks — video-time positions of the three F9 marks (10s, 12.7s, 16.9s of the 20s clip) */
  const pMarks = [
    { pos: 50, del: 0, hot: false },
    { pos: 63.5, del: clamp(seg(T, CUES.Player + 11.8, CUES.Player + 12.2, 0, 1, MOTION.draw), 0, 1), hot: T >= CUES.Player + 8.15 && T < CUES.Player + 11.8 },
    { pos: 84.5, del: 0, hot: false },
  ];
  const pJumpFlash = T >= CUES.Player + 8.15 && T < CUES.Player + 8.75;
  const pDelToast = clamp(seg(T, CUES.Player + 11.8, CUES.Player + 12.1, 0, 1, MOTION.enter) - seg(T, CUES.Player + 13.2, CUES.Player + 13.7, 0, 1, MOTION.draw), 0, 1);
  const presetOrder = ['flowmaster', 'plasma', 'equalizer', 'noise'];
  const presetLabels = ['Flowmaster', 'Plasma', 'Equalizer', 'Noise Field'];
  const pi = 0;
  const pNextFlash = false, pPrevFlash = false;
  const playerPreset = presetOrder[Math.min(pi, 3)];
  const playerPresetName = presetLabels[Math.min(pi, 3)];

  /* step 8 — settings */
  const settingsX = seg(T, CUES.Settings + 0.2, CUES.Settings + 1.1, 600, 0, MOTION.enter) +
    seg(T, CUES.Clean - 0.8, CUES.Clean - 0.1, 0, 600, MOTION.draw);
  const hotkey = T >= CUES.Settings + 6.9 ? 'F8' : 'F9';
  const focusTheme = holdBetween(T, CUES.Settings + 2.0, CUES.Settings + 6.3);
  const focusHotkey = holdBetween(T, CUES.Settings + 6.4, CUES.Clean - 0.5);

  /* step 9 — clean */
  const scan = holdBetween(T, CUES.Clean + 0.8, CUES.Assembler);
  const results = clamp(seg(T, CUES.Clean + 1.9, CUES.Clean + 4.4, 0, 1, MOTION.draw), 0, 1);
  const purge = clamp(seg(T, CUES.Clean + 5.6, CUES.Clean + 7.2, 0, 1, MOTION.draw), 0, 1);
  const purgePress = T >= CUES.Clean + 5.15 && T < CUES.Clean + 5.6;


  /* sessions list */
  const sessionReveal = clamp(seg(T, CUES.Session + 1.6, CUES.Session + 2.6, 0, 1, MOTION.enter), 0, 1);
  const sessions = [
    { filename: '2026-07-27 12-41-50.mkv', marks: markCount + (markCount === 1 ? ' mark' : ' marks'), date: 'Jul 27, 2026, 12:41 PM', dur: '2:41:12', reveal: sessionReveal },
    { filename: '2026-07-27 12-19-04.mkv', marks: '11 marks', date: 'Jul 27, 2026, 12:19 PM', dur: '0:21:48', reveal: 1 },
    { filename: '2026-07-14 21-54-39.mkv', marks: '1 mark', date: 'Jul 14, 2026, 9:54 PM', dur: '1:34:47', reveal: 1 },
    { filename: '2026-07-09 19-02-11.mkv', marks: '24 marks', date: 'Jul 9, 2026, 7:02 PM', dur: '3:11:07', reveal: 1 },
  ];

  /* spotlight focus rect — measured from the live DOM so it always lands on the real region */
  const rootRef = React.useRef(null);
  const [focusRect, setFocusRect] = React.useState(null);
  const focusKey = (T >= CUES.Windows + 1.9 && T < CUES.Windows + 7.3) ? 'windows'
    : (T >= CUES.Output + 0.7 && T < CUES.Output + 4.0) ? 'output'
      : (T >= CUES.Assembler + 2.0 && T < CUES.Assembler + 6.4) ? 'assembler' : null;
  React.useEffect(() => {
    if (!focusKey || !rootRef.current) { setFocusRect(r => (r === null ? r : null)); return; }
    const el = rootRef.current.querySelector('[data-focus-target="' + focusKey + '"]');
    if (!el) { setFocusRect(r => (r === null ? r : null)); return; }
    const rr = rootRef.current.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const s = rr.width / 1920 || 1;
    const next = { x: (er.left - rr.left) / s, y: (er.top - rr.top) / s, w: er.width / s, h: er.height / s };
    setFocusRect(p => (p && Math.abs(p.x - next.x) < 2 && Math.abs(p.y - next.y) < 2 && Math.abs(p.w - next.w) < 2 && Math.abs(p.h - next.h) < 2 ? p : next));
  }, [focusKey, Math.floor(T * 4)]);
  const focus = focusKey ? focusRect : null;
  const focusO = focus ? 0.55 * (
    focusKey === 'output' ? 1 - clamp(seg(T, CUES.Output + 3.3, CUES.Output + 4.0, 0, 1, MOTION.draw), 0, 1)
      : focusKey === 'windows' ? 1 - clamp(seg(T, CUES.Windows + 6.6, CUES.Windows + 7.2, 0, 1, MOTION.draw), 0, 1)
        : focusKey === 'assembler' ? 1 - clamp(seg(T, CUES.Assembler + 5.9, CUES.Assembler + 6.4, 0, 1, MOTION.draw), 0, 1)
          : 1) : 0;

  const step = STEPS[stepIdx];
  const capIn = clamp((T - stepStarts[stepIdx]) / 0.45, 0, 1);

  /* time-skip during the desktop→game fade: the clock races ahead ~14 min */
  const skipP = clamp(seg(T, CUES.Idle + 0.15, CUES.Idle + 1.15, 0, 1, MOTION.draw), 0, 1);
  const recSecs = Math.floor(clamp(T - (CUES.Record + 1.55), 0, 359999)) + Math.floor(skipP * 872);
  const recClock = fmt(Math.floor(recSecs / 3600)) + ':' + fmt(Math.floor((recSecs % 3600) / 60)) + ':' + fmt(recSecs % 60);
  const skipPulse = clamp(seg(T, CUES.Idle + 0.1, CUES.Idle + 0.5, 0, 1, MOTION.enter) - seg(T, CUES.Idle + 1.3, CUES.Idle + 1.9, 0, 1, MOTION.draw), 0, 1);
  const fmTrayOn = T >= CUES.OpenFM + 1.45;

  return (
    <div ref={rootRef} style={{ position: 'absolute', inset: 0, background: '#07080b', overflow: 'hidden' }}>
      {/* buffer the player clip before its scene arrives */}
      {!webgl && (
        <video src="uploads/2026-03-08 00-27-29_clip_005_0m12s-0m32s_1080p30.webm" preload="auto" muted playsInline
          style={{ position: 'absolute', width: 2, height: 2, opacity: 0, pointerEvents: 'none' }} />
      )}
      {/* desk backdrop */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(120% 90% at 50% 0%, #14171f 0%, #0a0c10 55%, #07080b 100%)',
      }} />

      {/* ── setup: company lockup on black ── */}
      {T < CUES.OpenOBS + 1.2 && (
        <div style={{
          position: 'absolute', inset: '0 0 36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: clamp(seg(T, CUES.Setup + 0.3, CUES.Setup + 1.2, 0, 1, MOTION.enter) - deskIn, 0, 1),
          pointerEvents: 'none',
        }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            transform: `scale(${1 + 0.04 * clamp((T - CUES.Setup) / 5, 0, 1)})`,
          }}>
            <img src="assets/logo-horizontal-lockup.svg" alt="Flowmaster — Live Studio" style={{ width: 780, display: 'block' }} />
          </div>
        </div>
      )}

      {/* ── desktop intro: open OBS → start Flowmaster → hit record ── */}
      {T >= CUES.OpenOBS - 0.6 && T < CUES.Idle + 1.3 && (() => {
        const OBSApp = window.OBSStudio;
        const tO = CUES.OpenOBS, tF = CUES.OpenFM, tR = CUES.Record, tG = CUES.Idle;
        const deskO = clamp(deskIn - gameIn, 0, 1);
        const obsOpen = seg(T, tO + 2.7, tO + 3.5, 0, 1, MOTION.enter);
        const fmOpen = seg(T, tF + 1.8, tF + 2.6, 0, 1, MOTION.enter);
        const connected = T >= tF + 3.4;
        const recOn = T >= tR + 1.55;
        const recT = '00:00:0' + Math.min(9, Math.max(0, Math.floor(T - (tR + 1.55))));
        const sm = p => p * p * (3 - 2 * p);
        const W = [
          [tO + 0.2, 1150, 620], [tO + 1.0, 1150, 620], [tO + 2.0, 96, 148],
          [tF + 0.3, 96, 148], [tF + 1.2, 92, 350],
          [tR + 0.3, 92, 350], [tR + 1.3, 1560, 768], [tR + 2.4, 1560, 768],
          [tR + 3.4, 92, 466], [tG + 40, 92, 466],
        ];
        let cx = W[0][1], cy = W[0][2];
        for (let i = 1; i < W.length; i++) {
          const a = W[i - 1], b = W[i];
          if (T >= a[0]) { const q = sm(clamp((T - a[0]) / (b[0] - a[0]), 0, 1)); cx = a[1] + (b[1] - a[1]) * q; cy = a[2] + (b[2] - a[2]) * q; }
        }
        const pulse = Math.max(...[tO + 2.25, tO + 2.5, tF + 1.45, tR + 1.5, tR + 3.55, tR + 3.8].map(t => T >= t ? clamp(1 - (T - t) / 0.4, 0, 1) : 0));
        const obsSel = T >= tO + 2.25 && obsOpen < 1;
        const gameSel = T >= tR + 3.55;
        const fmSel = T >= tF + 1.45 && fmOpen < 1;
        return (
          <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 36, overflow: 'hidden', opacity: deskO }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(95% 130% at 72% 88%, #1d4173 0%, #12244a 42%, #0a1226 78%, #070b18 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'conic-gradient(from 210deg at 74% 90%, rgba(90,140,220,.20), transparent 22%, transparent 78%, rgba(90,140,220,.12))' }} />
            {/* desktop icons */}
            <div style={{ position: 'absolute', left: 44, top: 84, width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '8px 0', borderRadius: 6, background: obsSel ? 'rgba(120,170,255,.22)' : 'transparent', border: '1px solid ' + (obsSel ? 'rgba(150,190,255,.5)' : 'transparent') }}>
              <img src="assets/obs-logo.svg" alt="OBS Studio" style={{ width: 58, height: 58, display: 'block' }} />
              <span style={{ fontSize: 12.5, color: '#eef2f8', textShadow: '0 1px 3px rgba(0,0,0,.9)', fontFamily: 'system-ui,Segoe UI,sans-serif' }}>OBS Studio</span>
            </div>
            <div style={{ position: 'absolute', left: 44, top: 200, width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '8px 0' }}>
              <div style={{ width: 56, height: 44, marginTop: 8, borderRadius: 5, background: 'linear-gradient(180deg, #f7c86b 0%, #e8a63f 100%)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: -7, width: 24, height: 10, borderRadius: '4px 4px 0 0', background: '#e8a63f' }} />
              </div>
              <span style={{ fontSize: 12.5, color: '#eef2f8', textShadow: '0 1px 3px rgba(0,0,0,.9)', fontFamily: 'system-ui,Segoe UI,sans-serif' }}>Recordings</span>
            </div>
            <div style={{ position: 'absolute', left: 44, top: 316, width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '8px 0', borderRadius: 6, background: fmSel ? 'rgba(120,170,255,.22)' : 'transparent', border: '1px solid ' + (fmSel ? 'rgba(150,190,255,.5)' : 'transparent') }}>
              <img src="assets/logo-emblem.svg" alt="Flowmaster" style={{ width: 54, marginTop: 6, display: 'block' }} />
              <span style={{ fontSize: 12.5, color: '#eef2f8', textShadow: '0 1px 3px rgba(0,0,0,.9)', fontFamily: 'system-ui,Segoe UI,sans-serif' }}>Flowmaster</span>
            </div>
            <div style={{ position: 'absolute', left: 44, top: 424, width: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '8px 0', borderRadius: 6, background: gameSel ? 'rgba(120,170,255,.22)' : 'transparent', border: '1px solid ' + (gameSel ? 'rgba(150,190,255,.5)' : 'transparent') }}>
              <div style={{ width: 54, height: 54, marginTop: 4, borderRadius: 8, background: '#d31f3c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="34" height="34" viewBox="0 0 34 34"><path d="M6 26 L17 6 L21 13 L14 26 Z" fill="#fff" /><path d="M19 26 L24 17 L28 26 Z" fill="#fff" /></svg>
              </div>
              <span style={{ fontSize: 12.5, color: '#eef2f8', textShadow: '0 1px 3px rgba(0,0,0,.9)', fontFamily: 'system-ui,Segoe UI,sans-serif' }}>THE FINALS</span>
            </div>
            {/* OBS window */}
            {obsOpen > 0 && (
              <div style={{
                position: 'absolute', left: 140, top: 30, width: 1640, height: 930,
                opacity: obsOpen, transform: `scale(${0.94 + 0.06 * obsOpen})`, transformOrigin: '18% 10%',
                boxShadow: '0 40px 120px rgba(0,0,0,.65)',
              }}>
                {OBSApp && <OBSApp recording={recOn} recTime={recT} recordGlow={T >= tR + 0.85 && T < tR + 1.55} />}
              </div>
            )}
            {/* Flowmaster window on top */}
            {fmOpen > 0 && (
              <div style={{
                position: 'absolute', left: 250, top: 140, width: 470, borderRadius: 10, overflow: 'hidden',
                background: '#20232a', border: '1px solid #33373f', boxShadow: '0 30px 90px rgba(0,0,0,.7)',
                opacity: fmOpen, transform: `translateY(${(1 - fmOpen) * 22}px) scale(${0.96 + 0.04 * fmOpen})`,
                fontFamily: 'system-ui,Segoe UI,sans-serif',
              }}>
                <div style={{ padding: '10px 14px', background: '#2b2f38', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src="assets/logo-emblem.svg" alt="" style={{ height: 12, display: 'block' }} />
                  <span style={{ color: '#dfe3ea', fontSize: 13, fontWeight: 600 }}>Flowmaster</span>
                  <span style={{ marginLeft: 'auto', color: '#7b828d', fontSize: 12, letterSpacing: 2 }}>– □ ✕</span>
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: recOn ? '#ff3b30' : connected ? '#34c759' : '#f5d440',
                    boxShadow: recOn ? '0 0 12px rgba(255,59,48,.9)' : connected ? '0 0 10px rgba(52,199,89,.7)' : '0 0 10px rgba(245,212,64,.7)',
                  }} />
                  <span style={{ color: '#f2f4f7', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {recOn ? 'Recording' : connected ? 'Connected to OBS' : 'Connecting to OBS…'}
                  </span>
                  <span style={{ marginLeft: 'auto', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, color: '#c9d1dc', whiteSpace: 'nowrap' }}>
                    {recOn ? recT : connected ? 'WebSocket :4455' : ''}
                  </span>
                </div>
                <div style={{ padding: '0 16px 14px', display: 'flex', gap: 8 }}>
                  {['Display Capture', 'Webcam', 'Mic', 'Desktop Audio'].map(s => (
                    <span key={s} style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 4, background: '#2b2f38', color: '#9aa3b0', whiteSpace: 'nowrap' }}>{s}</span>
                  ))}
                </div>
              </div>
            )}
            {/* click ripple + cursor */}
            {pulse > 0 && (
              <span style={{
                position: 'absolute', left: cx, top: cy, width: 44, height: 44, marginLeft: -22, marginTop: -22,
                borderRadius: '50%', border: '2px solid rgba(255,255,255,.9)', opacity: pulse * 0.85,
                transform: `scale(${0.35 + (1 - pulse) * 1.1})`, pointerEvents: 'none',
              }} />
            )}
            <svg width="26" height="30" viewBox="0 0 13 15" style={{ position: 'absolute', left: cx, top: cy, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}>
              <path d="M0 0 L0 12 L3 9.4 L5 14 L7 13.2 L5 8.8 L9 8.6 Z" fill="#fff" stroke="#000" strokeWidth="0.8" />
            </svg>
          </div>
        );
      })()}

      {/* ── fullscreen game capture (steps 1–3) ── */}
      <div style={{
        position: 'absolute', left: 0, top: 0, right: 0, bottom: 36, overflow: 'hidden',
        opacity: gameIn * (1 - gameOut), transform: `scale(${1 - gameOut * 0.06})`,
      }}>
        {webgl ? (
          <React.Fragment>
            <PresetVisual preset="plasma" T={T * 0.55} energy={0.5} />
            <GameHUD T={T} events={[markTimes[0] - 0.6, markTimes[1] - 0.6, markTimes[2] - 0.6]} />
          </React.Fragment>
        ) : (
          <GameVideo src="uploads/2026-03-08 00-27-29_clip_005_0m12s-0m32s_1080p30.webm" T={T} offset={CUES.Idle - 8} volume={0.65 * gameIn * (1 - gameOut)} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(70% 60% at 50% 45%, rgba(0,0,0,0) 0%, rgba(0,0,0,.55) 100%)' }} />
        <div style={{
          position: 'absolute', left: '50%', top: 24, transform: 'translateX(-50%)', fontFamily: 'ui-monospace,Menlo,monospace',
          fontSize: 15, letterSpacing: '.16em', color: 'rgba(255,255,255,.42)', textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}>game capture · 2560×1440 · 60 fps</div>
      </div>

      {/* OBS panel — collapses to a bare red-dot / Recording / clock strip */}
      {(() => {
        const p = clamp(seg(T, CUES.Idle + 0.5, CUES.Idle + 1.8, 0, 1, MOTION.enter), 0, 1); /* chrome dissolve */
        const g = 1 + p * 0.42; /* parts grow */
        return (
          <div style={{
            position: 'absolute', left: 56, top: 175 - p * 119, width: 440, borderRadius: 10, overflow: 'hidden',
            background: `rgba(32,35,42,${(1 - p) * 1})`, border: '1px solid rgba(51,55,63,' + (1 - p) + ')',
            opacity: gameIn * (1 - gameOut), transform: `translateY(${gameOut * 30}px)`, transformOrigin: '0 0',
            boxShadow: p > 0.98 ? 'none' : `0 24px 60px rgba(0,0,0,${0.6 * (1 - p)})`,
          }}>
            <div style={{
              padding: '10px 14px', background: `rgba(43,47,56,${1 - p})`, display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', fontSize: 13, fontWeight: 600, opacity: 1 - p,
              height: (1 - p) * 20, overflow: 'hidden', color: '#dfe3ea',
            }}>
              <span style={{ whiteSpace: 'nowrap' }}>OBS Studio 30.2.3</span>
              <span style={{ color: '#9aa3b0', fontSize: 11, whiteSpace: 'nowrap' }}>WebSocket :4455</span>
            </div>
            <div style={{ padding: `14px ${16 - p * 16}px`, display: 'flex', alignItems: 'center', gap: 12 * g }}>
              <span style={{
                width: 10 * g, height: 10 * g, borderRadius: '50%', background: '#ff3b30', flexShrink: 0,
                boxShadow: '0 0 12px rgba(255,59,48,.9)',
              }} />
              <span style={{
                color: '#fff', fontSize: 14 * g, fontWeight: 600, whiteSpace: 'nowrap',
                textShadow: p > 0.1 ? '0 2px 8px rgba(0,0,0,.85)' : 'none',
              }}>Recording</span>
              <span style={{
                marginLeft: 'auto', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 14 * g,
                color: p > 0.5 ? '#fff' : '#c9d1dc', fontVariantNumeric: 'tabular-nums',
                textShadow: p > 0.1 ? '0 2px 8px rgba(0,0,0,.85)' : 'none',
              }}>{recClock}</span>
            </div>
            <div style={{ padding: `0 16px ${16 * (1 - p)}px`, display: 'flex', gap: 8, opacity: 1 - p, height: (1 - p) * 22, overflow: 'hidden' }}>
              {['Display Capture', 'Webcam', 'Mic', 'Desktop Audio'].map(s => (
                <span key={s} style={{
                  fontSize: 10.5, padding: '3px 8px', borderRadius: 4, background: '#2b2f38', color: '#9aa3b0',
                  whiteSpace: 'nowrap',
                }}>{s}</span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* F9 keycap + mark toast */}
      <div style={{
        position: 'absolute', left: '34.5%', bottom: 228, transform: `translateX(-50%) scale(${1 + markFlash * 0.09})`,
        opacity: clamp(keyO - gameOut, 0, 1),
        display: 'flex', alignItems: 'center', gap: 18,
      }}>
        <div style={{
          width: 104, height: 104, borderRadius: 16, background: markFlash > 0.3 ? '#ff3333' : '#1b1e24',
          border: '2px solid ' + (markFlash > 0.3 ? '#ff6b6b' : '#3a3f48'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 34, fontWeight: 700,
          color: markFlash > 0.3 ? '#fff' : '#c9d1dc',
          boxShadow: markFlash > 0.3 ? '0 0 60px rgba(255,51,51,.6)' : '0 18px 40px rgba(0,0,0,.5)',
        }}>F9</div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          opacity: clamp(markFlash * 1.6, 0, 1), transform: `translateX(${(1 - clamp(markFlash * 2, 0, 1)) * -12}px)`,
        }}>
          <div style={{
            padding: '12px 18px', borderRadius: 10, background: 'rgba(16,17,20,.92)',
            border: '1px solid #ff3333', color: '#fff', fontSize: 16, fontWeight: 700,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ display: 'flex', gap: 3 }}>
              {['#f4383c', '#f5d440', '#6be553'].map(col => (
                <span key={col} style={{ width: 8, height: 8, borderRadius: 2, background: col }} />
              ))}
            </span>
<span style={{ whiteSpace: 'nowrap' }}>Mark {markCount} saved</span>
            <span style={{
              fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 13, color: '#ff9b9b', fontWeight: 500,
            }}>{recClock}</span>
          </div>
        </div>
      </div>

      {/* ── the app window ── */}
      <div style={{
        position: 'absolute', left: 340, top: 34, opacity: appIn,
        transform: `translateY(${(1 - appIn) * 46}px) scale(${0.985 + appIn * 0.015})`,
      }}>
        <AppWindow
          c={c} T={T} tab={tab}
          railPreset={T >= CUES.Player && T < CUES.Settings ? playerPreset : 'flowmaster'}
          presetLabel={T >= CUES.Player && T < CUES.Settings ? playerPresetName : 'Flowmaster'}
          energy={railEnergy}
          railNext={pNextFlash} railPrev={pPrevFlash}
        >
          {tab === 'mark' && (
            <MarkTab
              c={c} T={T} sessions={sessions} energy={railEnergy}
              newRowGlow={clamp(1 - (T - (CUES.Session + 1.6)) / 2.2, 0, 1) * (T > CUES.Session + 1.4 && T < CUES.Windows ? 1 : 0)}
              assemblerPress={T >= CUES.Assembler + 5.6 && T < CUES.Assembler + 6.05}
            />
          )}
          {tab === 'clip' && (
            <ClipTab
              c={c} T={T} lookback={lookback} lookforward={lookforward}
              reel={reel} clips={clips} extracting={extracting} extractPct={extractPct}
              extractStage={extractStage} selectedRow={T >= CUES.Windows + 1.0 ? 0 : -1}
            />
          )}
          {tab === 'clean' && <CleanTab c={c} scan={scan} results={results} purge={purge} purgePress={purgePress} />}
        </AppWindow>

        {playerO > 0.01 && (
          <PlayerModal c={c} T={T} o={playerO} preset={playerPreset} presetName={playerPresetName} playhead={playhead} t0={CUES.Player} marks={pMarks} jumpFlash={pJumpFlash} delToast={pDelToast} paused={pPaused} zoom={pZoom} webgl={webgl} />
        )}
        {settingsX < 599 && (
          <SettingsPanel c={c} T={T} x={settingsX} theme={themeName} hotkey={hotkey}
            focusTheme={focusTheme} focusHotkey={focusHotkey} />
        )}
      </div>

      {/* cursor for the MARK→CLIP tab click, row select and window drags */}
      {(() => {
        const tW = CUES.Windows;
        if (T < tW - 1.6 || T > tW + 8.3) return null;
        const sm = (x) => x * x * (3 - 2 * x);
        /* keyframes: tab → clip row → lookback slider → (trim back) → lookforward slider */
        const W = [
          [tW - 1.5, 1080, 330], [tW - 0.3, 960, 148], [tW + 0.25, 960, 148],
          [tW + 0.95, 403, 250], [tW + 1.75, 403, 250],
          [tW + 2.5, 694, 705], [tW + 6.0, 594, 705],
          [tW + 6.5, 1028, 705], [tW + 7.7, 1028, 705],
        ];
        let cx = W[0][1], cy = W[0][2];
        for (let i = 1; i < W.length; i++) {
          const a = W[i - 1], b = W[i];
          if (T >= a[0]) { const q = sm(clamp((T - a[0]) / (b[0] - a[0]), 0, 1)); cx = a[1] + (b[1] - a[1]) * q; cy = a[2] + (b[2] - a[2]) * q; }
        }
        /* while dragging, the cursor rides the moving edge of the red window (bar: 120s across 703px, mark at x=994) */
        const PX = 803 / 120, MX = 995;
        const dragLB = T >= tW + 2.5 && T < tW + 6.0, dragLF = T >= tW + 6.5 && T < tW + 7.7;
        if (dragLB) { cx = MX - lookback * PX; cy = 705; }
        if (dragLF) { cx = MX + lookforward * PX; cy = 705; }
        const dragging = dragLB || dragLF;
        const resizeHover = dragging || (T >= tW + 2.3 && T < tW + 2.5) || (T >= tW + 6.35 && T < tW + 6.5);
        const cO = Math.min(clamp((T - (tW - 1.6)) / 0.4, 0, 1), clamp(1 - (T - (tW + 7.6)) / 0.3, 0, 1));
        if (cO <= 0) return null;
        const pulse = Math.max(...[tW, tW + 1.0].map(t => T >= t ? clamp(1 - (T - t) / 0.4, 0, 1) : 0));
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 62, opacity: cO }}>
            {pulse > 0 && (
              <span style={{
                position: 'absolute', left: cx, top: cy, width: 40, height: 40, marginLeft: -20, marginTop: -20,
                borderRadius: '50%', border: '2px solid rgba(255,255,255,.9)', opacity: pulse * 0.85,
                transform: `scale(${0.35 + (1 - pulse) * 1.1})`,
              }} />
            )}
            {dragging && (
              <span style={{
                position: 'absolute', left: cx, top: cy, width: 30, height: 30, marginLeft: -15, marginTop: -15,
                borderRadius: '50%', background: 'rgba(255,255,255,.16)', border: '1px solid rgba(255,255,255,.4)',
              }} />
            )}
            {resizeHover ? (
              <svg width="30" height="16" viewBox="0 0 30 16" style={{ position: 'absolute', left: cx - 15, top: cy - 8, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' }}>
                <path d="M1 8 L8 2 L8 6 L22 6 L22 2 L29 8 L22 14 L22 10 L8 10 L8 14 Z" fill="#fff" stroke="#000" strokeWidth="1" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="26" height="30" viewBox="0 0 13 15" style={{ position: 'absolute', left: cx, top: cy, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}>
                <path d="M0 0 L0 12 L3 9.4 L5 14 L7 13.2 L5 8.8 L9 8.6 Z" fill="#fff" stroke="#000" strokeWidth="0.8" />
              </svg>
            )}
          </div>
        );
      })()}

      {/* extract complete toast */}
      {(() => {
        const o = clamp(seg(T, CUES.Extract + 4.1, CUES.Extract + 4.5, 0, 1, MOTION.enter) -
          seg(T, CUES.Settings + 0.6, CUES.Settings + 1.1, 0, 1, MOTION.draw), 0, 1);
        if (o <= 0.01) return null;
        return (
          <div style={{
            position: 'absolute', left: 700, top: 120, zIndex: 58, display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', borderRadius: 10, background: '#0e2415', border: '1px solid #2e9e4f',
            boxShadow: '0 18px 50px rgba(0,0,0,.55), 0 0 30px rgba(46,158,79,.28)',
            opacity: o, transform: `translateY(${(1 - o) * -14}px)`,
            fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: '50%', background: '#2e9e4f', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 700,
            }}>✓</span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: '#8ce6a6', whiteSpace: 'nowrap' }}>Extract complete</span>
              <span style={{ fontSize: 12, color: '#9fc9ad', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>31 clips + 1 reel · 29:15 · no re-encode</span>
            </span>
          </div>
        );
      })()}

      {/* cursor: click the Reel pill */}
      {(() => {
        const tO = CUES.Output;
        if (T < tO + 0.6 || T > tO + 3.0) return null;
        const sm = (x) => x * x * (3 - 2 * x);
        const q = sm(clamp((T - (tO + 0.7)) / 1.1, 0, 1));
        const cx = 900 + (1092 - 900) * q, cy = 600 + (806 - 600) * q;
        const cO = Math.min(clamp((T - (tO + 0.6)) / 0.4, 0, 1), clamp(1 - (T - (tO + 2.5)) / 0.4, 0, 1));
        if (cO <= 0) return null;
        const pulse = T >= tO + 2.0 ? clamp(1 - (T - (tO + 2.0)) / 0.4, 0, 1) : 0;
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 62, opacity: cO }}>
            {pulse > 0 && (
              <span style={{
                position: 'absolute', left: cx, top: cy, width: 40, height: 40, marginLeft: -20, marginTop: -20,
                borderRadius: '50%', border: '2px solid rgba(255,255,255,.9)', opacity: pulse * 0.85,
                transform: `scale(${0.35 + (1 - pulse) * 1.1})`,
              }} />
            )}
            <svg width="26" height="30" viewBox="0 0 13 15" style={{ position: 'absolute', left: cx, top: cy, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}>
              <path d="M0 0 L0 12 L3 9.4 L5 14 L7 13.2 L5 8.8 L9 8.6 Z" fill="#fff" stroke="#000" strokeWidth="0.8" />
            </svg>
          </div>
        );
      })()}

      {/* cursor: double-click the session row to open the video player */}
      {(() => {
        const tP = CUES.Player;
        if (T < tP - 2.35 || T > tP + 0.75) return null;
        const sm = (x) => x * x * (3 - 2 * x);
        const q = sm(clamp((T - (tP - 2.3)) / 1.5, 0, 1));
        const cx = 1050 + (470 - 1050) * q, cy = 705 + (250 - 705) * q;
        const cO = Math.min(clamp((T - (tP - 2.35)) / 0.3, 0, 1), clamp(1 - (T - (tP + 0.3)) / 0.4, 0, 1));
        if (cO <= 0) return null;
        const pulse = Math.max(...[tP - 0.5, tP - 0.22].map(t => T >= t ? clamp(1 - (T - t) / 0.4, 0, 1) : 0));
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 62, opacity: cO }}>
            {pulse > 0 && (
              <span style={{
                position: 'absolute', left: cx, top: cy, width: 40, height: 40, marginLeft: -20, marginTop: -20,
                borderRadius: '50%', border: '2px solid rgba(255,255,255,.9)', opacity: pulse * 0.85,
                transform: `scale(${0.35 + (1 - pulse) * 1.1})`,
              }} />
            )}
            <svg width="26" height="30" viewBox="0 0 13 15" style={{ position: 'absolute', left: cx, top: cy, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}>
              <path d="M0 0 L0 12 L3 9.4 L5 14 L7 13.2 L5 8.8 L9 8.6 Z" fill="#fff" stroke="#000" strokeWidth="0.8" />
            </svg>
          </div>
        );
      })()}

      {/* cursor for the recap mark click */}
      {(() => {
        const tP = CUES.Player;
        if (T < tP + 7.0 || T > tP + 11.2) return null;
        const sm = (x) => x * x * (3 - 2 * x);
        const W = [
          [tP + 7.0, 1210, 880], [tP + 8.1, 1103, 784], [tP + 20, 1103, 784],
        ];
        let cx = W[0][1], cy = W[0][2];
        for (let i = 1; i < W.length; i++) {
          const a = W[i - 1], b = W[i];
          if (T >= a[0]) { const q = sm(clamp((T - a[0]) / (b[0] - a[0]), 0, 1)); cx = a[1] + (b[1] - a[1]) * q; cy = a[2] + (b[2] - a[2]) * q; }
        }
        const cO = Math.min(clamp((T - (tP + 7.0)) / 0.4, 0, 1), clamp(1 - (T - (tP + 10.6)) / 0.4, 0, 1));
        if (cO <= 0) return null;
        const pulse = T >= tP + 8.3 ? clamp(1 - (T - (tP + 8.3)) / 0.4, 0, 1) : 0;
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 62, opacity: cO }}>
            {pulse > 0 && (
              <span style={{
                position: 'absolute', left: cx, top: cy, width: 40, height: 40, marginLeft: -20, marginTop: -20,
                borderRadius: '50%', border: '2px solid rgba(255,255,255,.9)', opacity: pulse * 0.85,
                transform: `scale(${0.35 + (1 - pulse) * 1.1})`,
              }} />
            )}
            <svg width="26" height="30" viewBox="0 0 13 15" style={{ position: 'absolute', left: cx, top: cy, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.7))' }}>
              <path d="M0 0 L0 12 L3 9.4 L5 14 L7 13.2 L5 8.8 L9 8.6 Z" fill="#fff" stroke="#000" strokeWidth="0.8" />
            </svg>
          </div>
        );
      })()}

      {/* spotlight dimming */}
      {focus && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: focus.y, background: `rgba(4,5,7,${focusO})` }} />
          <div style={{ position: 'absolute', left: 0, top: focus.y + focus.h, right: 0, bottom: 0, background: `rgba(4,5,7,${focusO})` }} />
          <div style={{ position: 'absolute', left: 0, top: focus.y, width: focus.x, height: focus.h, background: `rgba(4,5,7,${focusO})` }} />
          <div style={{ position: 'absolute', left: focus.x + focus.w, top: focus.y, right: 0, height: focus.h, background: `rgba(4,5,7,${focusO})` }} />
          <div style={{
            position: 'absolute', left: focus.x - 6, top: focus.y - 6, width: focus.w + 12, height: focus.h + 12,
            border: '1px solid rgba(255,51,51,.55)', borderRadius: 12, opacity: focusO / 0.55,
            boxShadow: '0 0 0 1px rgba(0,0,0,.5), 0 0 40px rgba(255,51,51,.18)',
          }} />
        </div>
      )}

      {/* taskbar */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 36,
        background: 'rgba(12,13,16,.92)', borderTop: '1px solid #1c1f26',
        display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px',
      }}>
        <span style={{ display: 'flex', gap: 3 }}>
          {[0, 1, 2, 3].map(i => <span key={i} style={{ width: 6, height: 6, background: '#5c6472', borderRadius: 1 }} />)}
        </span>
        <span style={{ width: 1, height: 18, background: '#22262e' }} />
        {['OBS', 'Chrome', 'Discord'].map(a => (
          <span key={a} style={{ fontSize: 11, color: '#6d7686', letterSpacing: '.04em' }}>{a}</span>
        ))}
        <span style={{ flex: 1 }} />
        <span style={{
          display: 'flex', alignItems: 'center', gap: 7, padding: '3px 10px', borderRadius: 6,
          background: fmTrayOn && T < CUES.Session ? 'rgba(255,51,51,.12)' : 'transparent',
          border: '1px solid ' + (fmTrayOn && T < CUES.Session ? 'rgba(255,51,51,.35)' : 'transparent'),
          opacity: fmTrayOn ? 1 : 0.38, filter: fmTrayOn ? 'none' : 'grayscale(1)',
        }}>
          <span style={{ display: 'flex', gap: 2 }}>
            {['#f4383c', '#f5d440', '#6be553'].map(col => (
              <span key={col} style={{
                width: 6, height: 6, borderRadius: 1, background: col,
                opacity: fmTrayOn && T < CUES.Session ? 0.7 + markFlash * 0.3 : 0.5,
              }} />
            ))}
          </span>
          <span style={{ fontSize: 11, color: '#9aa3b0', letterSpacing: '.04em' }}>
            <span style={{ whiteSpace: 'nowrap' }}>Flowmaster{fmTrayOn && T < CUES.Session ? ' · listening for F9' : ''}</span>
          </span>
        </span>
        <span style={{
          fontSize: 11, color: '#6d7686', fontFamily: 'ui-monospace,Menlo,monospace',
          fontVariantNumeric: 'tabular-nums',
        }}>21:54</span>
      </div>

      {/* ── caption band ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 36, height: 132,
        background: 'linear-gradient(0deg, rgba(5,6,8,.97) 0%, rgba(5,6,8,.9) 62%, rgba(5,6,8,0) 100%)',
        display: 'flex', alignItems: 'flex-end', padding: '0 64px 22px',
      }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 22,
          transform: `translateY(${(1 - capIn) * 8}px)`, opacity: clamp(capIn, 0, 1),
        }}>
          <div style={{
            fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 15, letterSpacing: '.14em',
            color: '#ff5c5c', fontWeight: 700, paddingBottom: 3, whiteSpace: 'nowrap',
          }}>{fmt(stepIdx)}<span style={{ color: '#4a4a4a' }}> / 14</span></div>
          <div>
            <div style={{
              fontSize: 34, fontWeight: 700, letterSpacing: '-.01em', color: '#fff', lineHeight: 1.15,
            }}>{step[0]}</div>
            <div style={{ fontSize: 20, color: '#b6bcc6', marginTop: 5, lineHeight: 1.35 }}>{step[1]}</div>
          </div>
        </div>
      </div>

      {/* step ticks + progress */}
      <div style={{ position: 'absolute', right: 64, bottom: 80, display: 'flex', gap: 6 }}>
        {STEPS.map((s, i) => (
          <span key={i} style={{
            width: i === stepIdx ? 26 : 8, height: 4, borderRadius: 2,
            background: i === stepIdx ? '#ff3333' : i < stepIdx ? 'rgba(255,255,255,.32)' : 'rgba(255,255,255,.12)',
          }} />
        ))}
      </div>

      {/* cursor: click Open Project Assembler */}
      {(() => {
        const tA = CUES.Assembler + 5.6;
        if (T < tA - 2.2 || T > tA + 0.7) return null;
        const sm = (x) => x * x * (3 - 2 * x);
        const q = sm(clamp((T - (tA - 2.15)) / 1.5, 0, 1));
        const cx = 470 + (802 - 470) * q, cy = 250 + (884 - 250) * q;
        const cO = Math.min(clamp((T - (tA - 2.2)) / 0.3, 0, 1), clamp(1 - (T - (tA + 0.25)) / 0.4, 0, 1));
        if (cO <= 0) return null;
        const pulse = T >= tA ? clamp(1 - (T - tA) / 0.4, 0, 1) : 0;
        return (
          <div style={{ position: 'absolute', left: cx, top: cy, zIndex: 62, opacity: cO, pointerEvents: 'none' }}>
            {pulse > 0 && (
              <div style={{
                position: 'absolute', left: 1, top: 1, width: 46, height: 46, marginLeft: -23, marginTop: -23,
                borderRadius: '50%', border: '2px solid rgba(255,255,255,.85)',
                transform: `scale(${0.3 + (1 - pulse) * 0.9})`, opacity: pulse * 0.8,
              }} />
            )}
            <svg width="26" height="30" viewBox="0 0 26 30" style={{ display: 'block', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,.75))' }}>
              <path d="M2 1 L2 22 L8 16.4 L12.2 26.5 L16.4 24.6 L12.2 14.8 L20.6 14.8 Z" fill="#fff" stroke="#111" strokeWidth="1.4" />
            </svg>
          </div>
        );
      })()}

      {/* ── editor launch: Project Assembler opens Prime Pro ── */}
      {T >= CUES.Editor - 0.8 && (() => {
        const Ed = window.EditorUI;
        const eIn = seg(T, CUES.Editor - 0.5, CUES.Editor + 0.4, 0, 1, MOTION.enter);
        const sec = clamp(5.23 + (T - (CUES.Editor + 1.8)), 5.23, 19.4);
        return (
          <div style={{
            position: 'absolute', left: 0, top: 0, right: 0, bottom: 36, zIndex: 55,
            opacity: eIn, transform: `scale(${0.985 + 0.015 * eIn})`, transformOrigin: '50% 40%',
          }}>
            {Ed && (
              <Ed sec={sec} dur={20} marks={[10, 16.9]} clipName="2026-07-27 12-41-50.mkv">
                <GameVideo src="uploads/2026-03-08 00-27-29_clip_005_0m12s-0m32s_1080p30.webm" T={T} offset={0} vt={sec}
                  hold={T < CUES.Editor + 1.8} volume={0.5 * eIn} style={{ objectFit: 'contain' }} />
              </Ed>
            )}
          </div>
        );
      })()}

      {/* fade to black at the end */}
      <div style={{
        position: 'absolute', inset: 0, background: '#07080b', pointerEvents: 'none', zIndex: 80,
        opacity: clamp(seg(T, CUES.Editor + 9.4, CUES.Editor + 10.9, 0, 1, MOTION.draw), 0, 1),
      }} />

      {/* music: Space Rent, −11 dB, ducked −6 dB under game audio */}
      <MusicTrack src="uploads/space-rent-f44e5985.webm" on={true} T={T} duck={Math.max(gameIn * (1 - gameOut), playerO, clamp((T - (CUES.Editor + 1.4)) / 0.6, 0, 1))} />

      <ReadyGate rootRef={rootRef} needsVideo={!webgl} />
    </div>
  );
}

window.FlowmasterStory = function FlowmasterStory(props) {
  const webgl = (props.footage ?? 'video') === 'webgl';
  return (
    <CompositionStage
      width={1920}
      height={1080}
      autoplay="false"
      scenes={window.OM_SCENES}
      playback={window.OM_PLAYBACK}
      bg="#07080b"
    >
      <Piece webgl={webgl} />
    </CompositionStage>
  );
};
