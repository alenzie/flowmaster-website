// The example recording used by every demo on the homepage: one 48-minute
// session with five marks. The before/after defaults are the app's own
// (lookback 60 s, lookforward 10 s).

export const DURATION = 48 * 60;
export const LOOKBACK = 60;
export const LOOKFORWARD = 10;
/** Seconds into the session at which the example marks land. Two of them sit
    40 seconds apart, so their ranges overlap and merge at the default settings. */
export const PRESET_MARKS = [372, 1060, 1100, 1866, 2512];

export type Range = { start: number; end: number };

/** The app's rule: keep a range around each mark, stop at the recording's
    edges, and merge ranges that overlap. */
export function windows(marks: number[], before = LOOKBACK, after = LOOKFORWARD, duration = DURATION): Range[] {
  const sorted = [...marks].sort((a, b) => a - b);
  const out: Range[] = [];
  for (const mark of sorted) {
    const start = Math.max(0, mark - before);
    const end = Math.min(duration, mark + after);
    const last = out[out.length - 1];
    if (last && start <= last.end) last.end = Math.max(last.end, end);
    else out.push({ start, end });
  }
  return out;
}

export const kept = (ranges: Range[]) => ranges.reduce((sum, r) => sum + (r.end - r.start), 0);

/** Same output as the app's formatDuration(): 5:10, or 1:02:03 past an hour. */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Recorder timecode: 00:14:32. */
export function timecode(seconds: number): string {
  const whole = Math.floor(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;
export const markLabel = (count: number) => plural(count, 'mark');

/** Deterministic activity levels for the small tape, 0..1, busier around the marks. */
export function tapeLevels(count = 160): number[] {
  let seed = 9;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  const raw = Array.from({ length: count }, () => rand());
  return raw.map((value, i) => {
    const smooth = (raw[i - 1] ?? value) * 0.3 + value * 0.4 + (raw[i + 1] ?? value) * 0.3;
    return Math.min(1, 0.16 + smooth * 0.5);
  });
}

/** Example file sizes. Every size on the page comes from one assumption: a
    40 Mbps recording, with clips cut at the same bitrate. Illustrations only. */
export const BITRATE_MBPS = 40;
export const bytesFor = (seconds: number) => Math.round((seconds * BITRATE_MBPS * 1_000_000) / 8);

/** Same output as the app's formatSize(). */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + units[i];
}

/** The example recordings, newest first. The first one is the session the hero records. */
export const RECORDINGS = [
  { id: 'r1', file: '2026-11-21 20-14-07.mp4', date: 'Nov 21, 2026, 8:14 PM', short: 'Nov 21, 8:14 PM', marks: PRESET_MARKS.length, duration: DURATION, highlights: kept(windows(PRESET_MARKS)), source: 'gameplay only' },
  { id: 'r2', file: '2026-11-19 21-02-44.mp4', date: 'Nov 19, 2026, 9:02 PM', short: 'Nov 19, 9:02 PM', marks: 11, duration: 5535, highlights: 640, source: 'gameplay + webcam' },
  { id: 'r3', file: '2026-11-16 19-37-10.mp4', date: 'Nov 16, 2026, 7:37 PM', short: 'Nov 16, 7:37 PM', marks: 3, duration: 7548, highlights: 210, source: 'gameplay only' },
  { id: 'r4', file: '2026-11-12 22-10-31.mp4', date: 'Nov 12, 2026, 10:10 PM', short: 'Nov 12, 10:10 PM', marks: 6, duration: 2470, highlights: 420, source: 'gameplay only' },
];

/** Example originals for the Clean demo. Sizes in bytes. */
export const CLEAN_FILES = RECORDINGS.map((recording) => ({
  id: recording.id,
  name: recording.file,
  size: bytesFor(recording.duration),
  path: 'D:' + String.fromCharCode(92) + 'Recordings' + String.fromCharCode(92) + recording.file,
}));
export const CLEAN_PRESELECTED = ['r1', 'r2'];

/** The take the demos below the hero show. It starts as the example session and
    becomes the visitor's own once they stop a recording in the hero with marks on it. */
export type Take = { marks: number[]; duration: number };
let take: Take = { marks: PRESET_MARKS, duration: DURATION };
const listeners = new Set<(take: Take) => void>();
export const getTake = () => take;
export function setTake(next: Take): void {
  take = next;
  listeners.forEach((fn) => fn(take));
}
/** Runs fn now and after every change. */
export function onTake(fn: (take: Take) => void): void {
  listeners.add(fn);
  fn(take);
}
