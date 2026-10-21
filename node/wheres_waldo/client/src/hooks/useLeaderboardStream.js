import { useEffect, useRef, useState } from 'react';

// Listens to the leaderboard stream (Server-Sent Events) and calls `onUpdate` — at most once per burst —
// whenever a ranked game finishes. Returns whether the stream is currently connected.
export function useLeaderboardStream(onUpdate, { url = '/api/leaderboards/stream', debounceMs = 150 } = {}) {
  const [live, setLive] = useState(false);
  const callback = useRef(onUpdate);
  callback.current = onUpdate;

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const source = new EventSource(url, { withCredentials: true });
    let timer = null;
    source.onopen = () => setLive(true);
    source.onerror = () => setLive(false);
    source.addEventListener('leaderboard', () => {
      clearTimeout(timer);
      timer = setTimeout(() => callback.current(), debounceMs);
    });
    return () => {
      clearTimeout(timer);
      source.close();
      setLive(false);
    };
  }, [url, debounceMs]);

  return live;
}
