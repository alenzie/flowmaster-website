/* Prime Pro editor UI — React port of the user's "Editor UI Mockup" DC, adapted to
   one clip + one audio track + recording marks. Registers window.EditorUI.
   Props: sec (playhead seconds), dur (clip length, default 20), marks ([secs]),
   clipName, children → program-monitor content. */
(function () {
  const S = 40; /* px per second on the timeline */
  const F = "'Segoe UI',system-ui,sans-serif";
  const tcOf = (sec) => {
    const m = Math.floor(sec / 60), ss = Math.floor(sec % 60), fr = Math.round((sec % 1) * 60);
    return '00:0' + m + ':' + String(ss).padStart(2, '0') + ':' + String(Math.min(59, fr)).padStart(2, '0');
  };
  const Hl = () => null;
  window.EditorUI = function EditorUI(props) {
    const sec = props.sec ?? 0;
    const dur = props.dur ?? 20;
    const marks = props.marks ?? [];
    const clipName = props.clipName ?? '2026-07-27 12-41-50.mkv';
    const tc = tcOf(sec);
    const clipW = dur * S;
    const ticks = [];
    for (let s = 0; s <= 32; s += 2) ticks.push('00:00:' + String(s).padStart(2, '0'));
    const bins = [
      { name: clipName, end: tcOf(dur), dot: '#3f8ae0', icon: '▤' },
      { name: 'Sequence 01', end: tcOf(dur), dot: '#c9d22f', icon: '⊞' },
    ];
    const transcript = [
      { range: '00:00:02:10 - 00:00:06:04', text: '[…] Got you. I love him that match. […]' },
      { range: '00:00:08:15 - 00:00:12:20', text: 'You know what they say. You do what you love. You never work a day in your life. […]' },
      { range: '00:00:14:02 - 00:00:19:11', text: '[…] Soared above the competition to secure the win. Congratulations from all of us here at the finals.' },
    ];
    const meterA = 0.42 + 0.2 * Math.abs(Math.sin(sec * 2.1)), meterB = 0.38 + 0.18 * Math.abs(Math.sin(sec * 1.7 + 1));
    const panelHead = { height: 30, display: 'flex', alignItems: 'center', padding: '0 8px', borderBottom: '1px solid #0f0f0f', flexShrink: 0, fontSize: 11 };
    const trackHead = { flex: '0 0 150px', width: 150, minWidth: 150, maxWidth: 150, boxSizing: 'border-box', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', background: '#252525', color: '#9a9a9a' };
    return (
      <div style={{ width: '100%', height: '100%', background: '#1d1d1d', color: '#c8c8c8', fontFamily: F, fontSize: 11, display: 'flex', flexDirection: 'column', overflow: 'hidden', userSelect: 'none', position: 'relative', boxSizing: 'border-box' }}>
        <div style={{ height: 26, background: '#232323', display: 'flex', alignItems: 'center', gap: 8, padding: '0 8px', flexShrink: 0, borderBottom: '1px solid #0f0f0f' }}>
          <div style={{ width: 16, height: 16, background: '#1c1a52', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9d8df0', fontSize: 9, fontWeight: 700 }}>Pp</div>
          <div style={{ color: '#bdbdbd', fontSize: 11.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>Prime Pro - D:\Video Backup\video projects\Flowmaster_2026-07-27 *</div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 22, color: '#9a9a9a', fontSize: 13, paddingRight: 6 }}><span>–</span><span style={{ fontSize: 10 }}>▢</span><span>✕</span></div>
        </div>
        <div style={{ height: 25, background: '#232323', display: 'flex', alignItems: 'center', gap: 22, padding: '0 14px', flexShrink: 0, color: '#c4c4c4', fontSize: 11.5, borderBottom: '1px solid #0f0f0f', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          <span>File</span><span>Edit</span><span>Clip</span><span>Sequence</span><span>Markers</span><span>Graphics and Titles</span><span>View</span><span>Window</span><span>Help</span>
        </div>
        <div style={{ height: 38, background: '#1d1d1d', display: 'flex', alignItems: 'center', padding: '0 12px', flexShrink: 0, borderBottom: '1px solid #0f0f0f' }}>
          <div style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b5b5b5', fontSize: 14 }}>⌂</div>
          <div style={{ display: 'flex', gap: 4, marginLeft: 10, fontSize: 12 }}>
            <div style={{ padding: '5px 12px', color: '#9a9a9a' }}>Import</div>
            <div style={{ padding: '5px 12px', color: '#fff', borderBottom: '2px solid #3f8ae0' }}>Edit</div>
            <div style={{ padding: '5px 12px', color: '#9a9a9a' }}>Export</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center', color: '#e2e2e2', fontSize: 12 }}>Flowmaster_2026-07-27 <span style={{ color: '#8a8a8a' }}>- Edited</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#b0b0b0', fontSize: 10.5 }}>
            <span style={{ letterSpacing: '.5px' }}>ESSENTIALS</span>
            <span style={{ fontSize: 12 }}>▦</span><span style={{ fontSize: 12 }}>⇪</span><span style={{ fontSize: 12 }}>☰</span><span style={{ fontSize: 12 }}>⌕</span><span style={{ fontSize: 12 }}>⛶</span>
            <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#8a5a3a,#3a2a4a)', border: '1px solid #555' }} />
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', minHeight: 0, gap: 1, background: '#0f0f0f' }}>
          <div style={{ width: 424, flexShrink: 0, background: '#232323', display: 'flex', flexDirection: 'column' }}>
            <div style={panelHead}>
              <span style={{ color: '#fff', padding: '0 8px 0 0', whiteSpace: 'nowrap' }}>Project: Flowmaster_2026-07-27 <span style={{ color: '#8a8a8a' }}>≡</span></span>
              <span style={{ color: '#8a8a8a', padding: '0 10px', whiteSpace: 'nowrap' }}>Effects</span>
              <span style={{ color: '#8a8a8a', padding: '0 10px', whiteSpace: 'nowrap' }}>Libraries</span>
              <span style={{ color: '#8a8a8a', padding: '0 10px', whiteSpace: 'nowrap' }}>Media Browser</span>
            </div>
            <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', flexShrink: 0 }}>
              <div style={{ flex: '0 0 200px', height: 20, background: '#141414', borderRadius: 3, display: 'flex', alignItems: 'center', padding: '0 8px', color: '#777' }}>⌕</div>
              <div style={{ flex: 1 }} />
              <span style={{ color: '#9a9a9a' }}>2 items</span>
            </div>
            <div style={{ height: 22, display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0, color: '#9a9a9a', borderTop: '1px solid #191919', borderBottom: '1px solid #191919' }}>
              <div style={{ width: 26 }} />
              <div style={{ flex: 1 }}>Name <span style={{ color: '#3f8ae0' }}>↑</span></div>
              <div style={{ width: 72 }}>Frame Rate</div>
              <div style={{ width: 88 }}>Media Start</div>
              <div style={{ width: 88 }}>Media End</div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              {bins.map(row => (
                <div key={row.name} style={{ height: 24, display: 'flex', alignItems: 'center', padding: '0 10px', color: '#c0c0c0', borderBottom: '1px solid #1e1e1e' }}>
                  <div style={{ width: 26, display: 'flex', alignItems: 'center', flexShrink: 0 }}><div style={{ width: 12, height: 12, borderRadius: 2, background: row.dot }} /></div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', whiteSpace: 'nowrap', minWidth: 0 }}><span style={{ color: '#7fb2d9', fontSize: 10 }}>{row.icon}</span><span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}</span></div>
                  <div style={{ width: 72, flexShrink: 0 }}>60.00 fps</div>
                  <div style={{ width: 88, flexShrink: 0 }}>00:00:00:00</div>
                  <div style={{ width: 88, flexShrink: 0 }}>{row.end}</div>
                </div>
              ))}
            </div>
            <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 14, padding: '0 12px', flexShrink: 0, borderTop: '1px solid #0f0f0f', color: '#9a9a9a' }}>
              <span style={{ color: '#4ac0e0' }}>✎</span><span>▥</span><span>▣</span><span>⧉</span>
              <div style={{ width: 80, height: 3, background: '#3a3a3a', borderRadius: 2, position: 'relative' }}><div style={{ position: 'absolute', left: '20%', top: -3, width: 9, height: 9, borderRadius: '50%', background: '#8a8a8a' }} /></div>
              <div style={{ flex: 1 }} />
              <span>🗀</span><span>⧉</span><span>🗑</span>
            </div>
          </div>
          <div style={{ flex: 1, background: '#232323', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={panelHead}>
              <span style={{ color: '#8a8a8a', padding: '0 10px' }}>Source: (no clips)</span>
              <span style={{ color: '#fff', padding: '0 10px' }}>Program: Sequence 01 <span style={{ color: '#8a8a8a' }}>≡</span></span>
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#161616', minWidth: 0, minHeight: 0, padding: 10 }}>
              <div style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}>
                {props.children || (
                  <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg,#1b2226 0 14px,#161c20 14px 28px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: 'ui-monospace,Menlo,monospace', color: '#4d6570', fontSize: 12 }}>[ program monitor ]</span>
                  </div>
                )}
              </div>
            </div>
            <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', flexShrink: 0 }}>
              <span style={{ color: '#3f8ae0', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12.5 }}>{tc}</span>
              <div style={{ height: 20, background: '#2d2d2d', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', color: '#c0c0c0' }}>Fit <span style={{ fontSize: 8 }}>▾</span></div>
              <div style={{ flex: 1 }} />
              <div style={{ height: 20, background: '#2d2d2d', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', color: '#c0c0c0' }}>Full <span style={{ fontSize: 8 }}>▾</span></div>
              <span style={{ color: '#c8c8c8', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12.5 }}>{tcOf(dur)}</span>
            </div>
            <div style={{ height: 14, margin: '0 12px', background: 'repeating-linear-gradient(90deg,#3d3d3d 0 1px,transparent 1px 7px)', position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', top: 0, bottom: 0, width: 9, background: '#3f8ae0', clipPath: 'polygon(0 0,100% 0,100% 45%,50% 100%,0 45%)', left: 'calc(' + (sec / dur * 100).toFixed(2) + '% - 4px)' }} />
            </div>
            <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexShrink: 0, color: '#c0c0c0', fontSize: 13, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 12, display: 'flex', gap: 14, color: '#b0b0b0' }}><span>⌕</span><span>⚑</span><span>{'{'}</span><span>{'}'}</span></span>
              <span>⇤</span><span>◁</span><span style={{ fontSize: 12 }}>{sec > 0 && sec < dur ? '❚❚' : '■'}</span><span>▷</span><span>⇥</span>
            </div>
          </div>
          <div style={{ width: 424, flexShrink: 0, background: '#232323', display: 'flex', flexDirection: 'column' }}>
            <div style={panelHead}>
              <span style={{ color: '#8a8a8a', padding: '0 8px', whiteSpace: 'nowrap' }}>Properties</span>
              <span style={{ color: '#8a8a8a', padding: '0 8px', whiteSpace: 'nowrap' }}>Effect Controls</span>
              <span style={{ color: '#8a8a8a', padding: '0 8px', whiteSpace: 'nowrap' }}>Lumetri Color</span>
              <span style={{ color: '#fff', padding: '0 8px', whiteSpace: 'nowrap' }}>Text <span style={{ color: '#8a8a8a' }}>≡</span></span>
            </div>
            <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 16, padding: '0 12px', flexShrink: 0, borderBottom: '1px solid #191919' }}>
              <span style={{ color: '#fff', borderBottom: '2px solid #3f8ae0', paddingBottom: 4 }}>Transcript</span>
              <span style={{ color: '#8a8a8a' }}>Captions</span>
              <span style={{ color: '#8a8a8a' }}>Graphics</span>
            </div>
            <div style={{ height: 32, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', flexShrink: 0 }}>
              <div style={{ flex: 1, height: 22, background: '#141414', borderRadius: 3, display: 'flex', alignItems: 'center', gap: 6, padding: '0 8px', color: '#777' }}>⌕ Search</div>
              <span style={{ color: '#9a9a9a' }}>✎</span><span style={{ color: '#9a9a9a' }}>CC</span><span style={{ color: '#9a9a9a' }}>⋯</span>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', padding: '2px 0' }}>
              {transcript.map(t => (
                <div key={t.range} style={{ display: 'flex', gap: 14, padding: '10px 14px', borderBottom: '1px solid #1e1e1e' }}>
                  <div style={{ width: 64, flexShrink: 0, color: '#9a9a9a' }}>Unknown</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#9a9a9a', marginBottom: 4, fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 10 }}>{t.range}</div>
                    <div style={{ color: '#d6d6d6', lineHeight: 1.5 }}>{t.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 30, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', flexShrink: 0, borderTop: '1px solid #0f0f0f', color: '#9a9a9a' }}>
              <div style={{ width: 12, height: 12, background: '#3f8ae0', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 9 }}>✓</div>
              <span style={{ color: '#c0c0c0' }}>Follow active monitor</span>
              <div style={{ flex: 1 }} />
              <span>⚙</span>
            </div>
          </div>
        </div>
        <div style={{ height: 332, flexShrink: 0, display: 'flex', background: '#1d1d1d', borderTop: '1px solid #0f0f0f' }}>
          <div style={{ width: 34, flexShrink: 0, background: '#232323', borderRight: '1px solid #0f0f0f', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, paddingTop: 8, color: '#9a9a9a', fontSize: 12 }}>
            {['➤', '⬚', '⇹', '⟷', '✂', '▭', '✒', '✋', 'T'].map((g, i) => (
              <div key={g} style={{ width: 26, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#3f8ae0' : '#9a9a9a' }}>{g}</div>
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: '#232323', position: 'relative' }}>
            <div style={{ height: 26, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', flexShrink: 0, borderBottom: '1px solid #0f0f0f' }}>
              <span style={{ color: '#777' }}>×</span><span style={{ color: '#fff' }}>Sequence 01</span><span style={{ color: '#8a8a8a' }}>≡</span>
            </div>
            <div style={{ height: 24, display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0 }}>
              <span style={{ color: '#3f8ae0', fontFamily: 'ui-monospace,Menlo,monospace', fontSize: 12.5 }}>{tc}</span>
            </div>
            <div style={{ height: 22, display: 'flex', flexShrink: 0, borderBottom: '1px solid #161616' }}>
              <div style={{ flex: '0 0 150px', width: 150, minWidth: 150, maxWidth: 150, boxSizing: 'border-box', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 9, padding: '0 8px', color: '#9a9a9a', fontSize: 10 }}>
                <span style={{ color: '#3f8ae0' }}>⇉</span><span style={{ color: '#3f8ae0' }}>∩</span><span>⚑</span><span>CC</span>
              </div>
              <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', height: '100%', alignItems: 'flex-end', color: '#7a7a7a', fontSize: 9 }}>
                  {ticks.map(k => (
                    <div key={k} style={{ flexShrink: 0, width: 2 * S, boxSizing: 'border-box', borderLeft: '1px solid #3d3d3d', padding: '0 0 3px 3px', whiteSpace: 'nowrap' }}>{k}</div>
                  ))}
                </div>
                {marks.map(m => (
                  <div key={m} style={{ position: 'absolute', top: 1, left: m * S - 4, width: 9, height: 12, background: '#2e9e4f', clipPath: 'polygon(0 0,100% 0,100% 62%,50% 100%,0 62%)', zIndex: 4 }} />
                ))}
                <div style={{ position: 'absolute', left: 0, width: clipW, bottom: 0, height: 2, background: '#d5a021' }} />
              </div>
            </div>
            <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
              {['V3', 'V2'].map(v => (
                <div key={v} style={{ height: 32, display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={trackHead}><span style={{ fontSize: 9 }}>🔒</span><span style={{ color: '#c0c0c0' }}>{v}</span><span style={{ fontSize: 9 }}>⧉</span><span style={{ fontSize: 10 }}>👁</span></div>
                  <div style={{ flex: 1, background: '#1f1f1f' }} />
                </div>
              ))}
              <div style={{ height: 44, display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
                <div style={trackHead}><span style={{ fontSize: 9 }}>🔒</span><span style={{ background: '#3f8ae0', color: '#fff', padding: '1px 5px', borderRadius: 2, fontSize: 10 }}>V1</span><span style={{ fontSize: 9 }}>⧉</span><span style={{ fontSize: 10 }}>👁</span></div>
                <div style={{ flex: 1, background: '#1f1f1f', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ flexShrink: 0, height: '100%', width: clipW, boxSizing: 'border-box', background: '#2b3c4c', border: '1px solid #10161c', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 16, background: '#41566b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px', overflow: 'hidden' }}>
                      <span style={{ color: '#dfe7ee', fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{clipName} [V]</span>
                      <span style={{ color: '#9fb4c6', fontSize: 8, fontStyle: 'italic', flexShrink: 0 }}>fx</span>
                    </div>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', paddingLeft: 3 }}><div style={{ width: 34, height: 20, background: 'repeating-linear-gradient(45deg,#54432c 0 5px,#3d3322 5px 10px)' }} /></div>
                  </div>
                </div>
              </div>
              <div style={{ height: 40, display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
                <div style={{ ...trackHead, gap: 7 }}><span style={{ fontSize: 9 }}>🔒</span><span style={{ background: '#3f8ae0', color: '#fff', padding: '1px 5px', borderRadius: 2, fontSize: 10 }}>A1</span><span style={{ fontSize: 9 }}>M</span><span style={{ fontSize: 9 }}>S</span><span style={{ fontSize: 10 }}>🎙</span></div>
                <div style={{ flex: 1, background: '#1f1f1f', display: 'flex', overflow: 'hidden' }}>
                  <div style={{ flexShrink: 0, height: '100%', width: clipW, boxSizing: 'border-box', background: '#123f4a', border: '1px solid #0d2a30', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '70%', transform: 'translateY(-50%)', background: 'repeating-linear-gradient(90deg,#4a99a8 0 1px,transparent 1px 3px)', opacity: .85 }} />
                    <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: '#5fb2c0' }} />
                    <div style={{ position: 'absolute', left: 3, top: 2, color: '#bfe4ea', fontSize: 8 }}>✳</div>
                  </div>
                </div>
              </div>
              {['A2', 'A3'].map(a => (
                <div key={a} style={{ height: 40, display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ ...trackHead, gap: 7 }}><span style={{ fontSize: 9 }}>🔒</span><span style={{ background: '#2d2d2d', color: '#c0c0c0', padding: '1px 5px', borderRadius: 2, fontSize: 10 }}>{a}</span><span style={{ fontSize: 9 }}>M</span><span style={{ fontSize: 9 }}>S</span><span style={{ fontSize: 10 }}>🎙</span></div>
                  <div style={{ flex: 1, background: '#1f1f1f' }} />
                </div>
              ))}
              <div style={{ height: 12, display: 'flex', alignItems: 'center', padding: '0 8px 0 158px' }}><div style={{ flex: 1, height: 7, background: '#3a3a3a', borderRadius: 4, maxWidth: '42%' }} /></div>
            </div>
            <div style={{ position: 'absolute', left: 150, right: 0, top: 50, bottom: 12, overflow: 'hidden', pointerEvents: 'none', zIndex: 7 }}>
              {marks.map(m => (
                <div key={m} style={{ position: 'absolute', top: 22, bottom: 0, left: m * S, width: 0, borderLeft: '1px dashed #2e9e4f', opacity: .85 }} />
              ))}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: sec * S, width: 1, background: '#3f8ae0' }}>
                <div style={{ position: 'absolute', top: 0, left: -4, width: 9, height: 10, background: '#3f8ae0', clipPath: 'polygon(0 0,100% 0,100% 55%,50% 100%,0 55%)' }} />
              </div>
            </div>
          </div>
          <div style={{ width: 78, flexShrink: 0, background: '#1d1d1d', borderLeft: '1px solid #0f0f0f', display: 'flex', padding: '10px 6px 18px 8px', gap: 5 }}>
            <div style={{ flex: 1, display: 'flex', gap: 3 }}>
              {[meterA, meterB].map((h, i) => (
                <div key={i} style={{ flex: 1, background: '#111', borderRadius: 1, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: (h * 100) + '%', background: 'linear-gradient(to top,#1f8a2c 0 78%, #7fc12f 78% 92%, #c9d22f 92% 100%)' }} />
                </div>
              ))}
            </div>
            <div style={{ width: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#8a8a8a', fontSize: 8, padding: '2px 0' }}>
              {['0', '-6', '-12', '-18', '-24', '-30', '-36', '-42', '-48', '-54', 'dB'].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>
        </div>
      </div>
    );
  };
})();
