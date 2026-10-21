import { useEffect, useRef, useState } from 'react';
import { elapsedMs } from '../lib/time.js';

// The running time of a game: real time since the server's `startedAt`, plus the penalties so far.
// The offset between the server's clock and this device's is measured once, when the game arrives.
export function useStopwatch({ startedAt, serverTime, penaltyMs, running, intervalMs = 47 }) {
  const offset = useRef(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!startedAt) return;
    offset.current = serverTime ? Date.parse(serverTime) - Date.now() : 0;
    setNow(Date.now());
  }, [startedAt, serverTime]);

  useEffect(() => {
    if (!running) return undefined;
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [running, intervalMs]);

  if (!startedAt) return 0;
  return elapsedMs({ startedAt, penaltyMs, nowMs: now, clockOffsetMs: offset.current });
}
