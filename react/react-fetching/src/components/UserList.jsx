import { useEffect, useState } from 'react'
import { fetchUsers, BROKEN_URL } from '../api/users'

/**
 * DEMO 1 - fetch inside useEffect, request on mount.
 *
 * The empty dependency array `[]` means: run this effect once,
 * right after the component mounts, and never again.
 *
 * The request itself is a side effect, so it cannot live in the
 * component body (that would run on every render). useEffect is
 * the React API made for side effects.
 *
 * Notice the THREE states of the request:
 * - data: the list of users (starts empty)
 * - loading: true while the request is in flight
 * - error: message string when something went wrong
 *
 * Also notice the conditional rendering: only ONE of the three
 * return branches renders at a time.
 */
export default function UserList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Flag to avoid setting state after the component unmounts.
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchUsers()
        if (!cancelled) setUsers(result)
      } catch (err) {
        // Both network errors and HTTP errors land here,
        // because fetchUsers throws when !response.ok.
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    // Cleanup runs on unmount (and before re-running the effect).
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <p className="status">Loading users...</p>

  if (error) return <p className="status error">{error}</p>

  return (
    <ul className="user-list">
      {users.map((user) => (
        <li key={user.id}>
          <strong>{user.name}</strong> - {user.email}
        </li>
      ))}
    </ul>
  )
}

/**
 * DEMO 1b - same component but fetching from a broken URL,
 * so you can SEE the error state render. Toggle by editing the
 * url argument in the load() call above.
 */
export function BrokenList() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchUsers(BROKEN_URL)
        if (!cancelled) setUsers(result)
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
  }, [])

  if (loading) return <p className="status">Loading users...</p>

  if (error) return <p className="status error">{error}</p>

  return (
    <ul className="user-list">
      {users.map((user) => (
        <li key={user.id}>
          <strong>{user.name}</strong> - {user.email}
        </li>
      ))}
    </ul>
  )
}
