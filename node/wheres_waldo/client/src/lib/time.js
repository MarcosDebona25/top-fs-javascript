// Every time in the app is a whole number of milliseconds, shown as m:ss.mmm (minutes are not capped at 59).
export function formatTime(ms) {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return 'n/a';
  const total = Math.max(0, Math.round(ms));
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const millis = total % 1000;
  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(3, '0')}`;
}

// "+2.000": a penalty, always with its sign.
export function formatPenalty(ms) {
  return `+${(Math.max(0, ms) / 1000).toFixed(3)}`;
}

// "+1.0 s": the short form used in the miss toast.
export function formatSecondsShort(ms) {
  return `+${(Math.max(0, ms) / 1000).toFixed(1)} s`;
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

// Elapsed time of a running game. `clockOffsetMs` is serverTime - localNow at the moment the game arrived,
// so a wrong local clock does not skew the stopwatch.
export function elapsedMs({ startedAt, penaltyMs = 0, nowMs, clockOffsetMs = 0 }) {
  const started = typeof startedAt === 'number' ? startedAt : Date.parse(startedAt);
  return Math.max(0, nowMs + clockOffsetMs - started) + penaltyMs;
}
