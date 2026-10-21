import { useEffect, useMemo, useState } from 'react';
import { elapsedMs } from '../lib/time.js';

// The running time of a game: real time since the server's `startedAt`, plus the penalties so far.
// The offset between the server's clock and this device's is measured once, when the game arrives.
export function useStopwatch({ startedAt, serverTime, penaltyMs, running, intervalMs = 47 }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const offset = useMemo(() => (serverTime ? Date.parse(serverTime) - Date.now() : 0), [startedAt, serverTime]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return undefined;
    // One sync when the clock starts; after that only the interval updates it.
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [running, intervalMs, startedAt]);

  if (!startedAt) return 0;
  return elapsedMs({ startedAt, penaltyMs, nowMs: now, clockOffsetMs: offset });
}
