import { useEffect, useState } from 'react'

/**
 * Custom hook that encapsulates the three states of a request:
 * data, loading and error.
 *
 * A custom hook is a function whose name starts with "use".
 * RULES OF HOOKS: hooks (useState, useEffect, ...) can only be
 * called at the TOP LEVEL of a component or of another hook.
 * They can NEVER be called inside a function such as an event
 * handler, a helper, or a condition. A custom hook is the way to
 * extract this logic without breaking that rule.
 *
 * Usage:
 *   const { data, loading, error } = useFetch(fetchUsers, [])
 *
 * @param {() => Promise<any>} fetcher - function that returns a promise
 * @param {Array} deps - dependencies that re-trigger the effect
 */
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetcher()
        if (!cancelled) setData(result)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // The fetcher and deps come from outside; eslint would ask
    // for fetcher in the deps, but for this learning project the
    // caller controls the dependencies explicitly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { data, loading, error }
}
