import { useCallback, useEffect, useState } from 'react';

// Loads something when `deps` change. `reload()` fetches again and keeps showing the old data meanwhile
// (the live leaderboards use it); changing `deps` drops the old data because it belongs to something else.
export function useResource(loader, deps, { keepPreviousData = false } = {}) {
  const key = JSON.stringify(deps);
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ key, dataKey: null, data: null, error: null, loading: true });

  useEffect(() => {
    const controller = new AbortController();
    // The first render already starts in the loading state; only flip it when a reload or a new key
    // actually needs a visible transition. This avoids an extra render on every mount.
    setState((current) => (current.loading ? current : { ...current, loading: true }));
    loader(controller.signal).then(
      (data) => setState({ key, dataKey: key, data, error: null, loading: false }),
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
  const error = fresh ? state.error : null;
  const data = state.dataKey === key || (keepPreviousData && state.dataKey !== null && !error) ? state.data : null;
  return { data, error, loading: !fresh || state.loading, pending: !fresh, reload };
}
