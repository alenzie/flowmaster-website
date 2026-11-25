// Phones watch Flowmaster videos in landscape only. A player that is open or
// playing holds the gate; while any player holds it and the phone is upright,
// the full-screen "turn your phone" prompt covers everything and the players
// are paused. Turning the phone sideways lifts it; "Close the video" gives up.
// The prompt itself lives in RotateGate.astro. Adapted from kavi-portfolio's
// phone-experience.js portrait gate.

export interface LandscapeHold {
  /** The phone went upright: stop the picture. */
  block?: () => void;
  /** The phone is sideways again. */
  clear?: () => void;
  /** The visitor chose to close the video from the prompt. */
  cancel?: () => void;
}

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent || '';
export const isPhone =
  (typeof navigator !== 'undefined' && (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData?.mobile === true) ||
  /iPhone|iPod|Android.+Mobile|Windows Phone/i.test(ua);

export const needsRotation = () => isPhone && window.innerHeight > window.innerWidth;

const holds = new Set<LandscapeHold>();
let blocked = false;
let wired = false;

const gate = () => document.querySelector<HTMLDialogElement>('[data-rotate-gate]');

function sync() {
  const dialog = gate();
  if (!dialog) return;
  const block = holds.size > 0 && needsRotation();
  if (block) {
    if (!blocked) { blocked = true; [...holds].forEach((h) => h.block?.()); }
    // Shown last so it sits above any player dialog that opened before it.
    if (!dialog.open) { dialog.showModal(); dialog.focus({ preventScroll: true }); }
  } else {
    if (dialog.open) dialog.close();
    if (blocked) { blocked = false; [...holds].forEach((h) => h.clear?.()); }
  }
}

function wire() {
  if (wired) return;
  wired = true;
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', sync);
  window.matchMedia('(orientation: portrait)').addEventListener?.('change', sync);
  const dialog = gate();
  if (!dialog) return;
  const cancelAll = () => { [...holds].forEach((h) => h.cancel?.()); holds.clear(); sync(); };
  dialog.querySelector('[data-rotate-close]')?.addEventListener('click', cancelAll);
  dialog.addEventListener('cancel', (event) => { event.preventDefault(); cancelAll(); });
}

/** Hold the landscape gate while a video is open or playing. Returns the release. */
export function holdLandscape(hold: LandscapeHold): () => void {
  wire();
  holds.add(hold);
  sync();
  return () => { if (holds.delete(hold)) sync(); };
}
