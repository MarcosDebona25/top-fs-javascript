import { useEffect, useRef } from 'react';

// Listens to the leaderboard stream (Server-Sent Events) and calls `onUpdate` at most once per burst
// whenever a ranked game finishes. Connection state is not rendered, so opening or dropping the
// stream does not re-render the whole page.
export function useLeaderboardStream(onUpdate, { url = '/api/leaderboards/stream', debounceMs = 150 } = {}) {
  const callback = useRef(onUpdate);
  callback.current = onUpdate;

  useEffect(() => {
    if (typeof EventSource === 'undefined') return undefined;
    const source = new EventSource(url, { withCredentials: true });
    let timer = null;
    source.addEventListener('leaderboard', () => {
      clearTimeout(timer);
      timer = setTimeout(() => callback.current(), debounceMs);
    });
    return () => {
      clearTimeout(timer);
      source.close();
    };
  }, [url, debounceMs]);
}
