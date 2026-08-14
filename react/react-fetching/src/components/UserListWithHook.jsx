import { useFetch } from '../hooks/useFetch'
import { fetchUsers } from '../api/users'

/**
 * DEMO 2 - the same request as Demo 1, but using the custom hook.
 *
 * The component no longer manages data/loading/error by hand:
 * it just asks useFetch for the three states and renders them.
 * This is why custom hooks exist: reusable logic without duplicating
 * useEffect code in every component.
 */
export default function UserListWithHook() {
  const { data, loading, error } = useFetch(fetchUsers, [])

  if (loading) return <p className="status">Loading users...</p>

  if (error) return <p className="status error">{error}</p>

  return (
    <ul className="user-list">
      {data.map((user) => (
        <li key={user.id}>
          <strong>{user.name}</strong> - {user.email}
        </li>
      ))}
    </ul>
  )
}
