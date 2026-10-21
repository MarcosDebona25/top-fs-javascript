import { useCallback, useEffect, useState } from 'react';

// Loads something when `deps` change. `reload()` fetches again and keeps showing the old data meanwhile
// (the live leaderboards use it); changing `deps` drops the old data because it belongs to something else.
export function useResource(loader, deps) {
  const key = JSON.stringify(deps);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ key, data: null, error: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, loading: true }));
    loader(controller.signal).then(
      (data) => setState({ key, data, error: null, loading: false }),
      (error) => {
        if (error.name === 'AbortError') return;
        setState((current) => ({ ...current, key, error, loading: false }));
      },
    );
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const reload = useCallback(() => setTick((value) => value + 1), []);
  const fresh = state.key === key;
  return { data: fresh ? state.data : null, error: fresh ? state.error : null, loading: !fresh || state.loading, reload };
}
