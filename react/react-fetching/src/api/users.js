// JSONPlaceholder is a free fake API used for learning.
export const USERS_URL = 'https://jsonplaceholder.typicode.com/users'

// Deliberately broken URL used to demonstrate the error state.
export const BROKEN_URL = 'https://jsonplaceholder.typicode.com/this-route-does-not-exist'

/**
 * Fetches the user list and throws on a failed request.
 *
 * KEY CONCEPT: fetch only rejects the promise on NETWORK errors
 * (offline, DNS failure, CORS). An HTTP error status like 404 or
 * 500 still RESOLVES the promise, so you must check the response
 * status yourself.
 *
 * response.ok is true when status is between 200 and 299.
 * Checking `status >= 400` works in practice (fetch follows
 * redirects, so 3xx never reaches the final response), but
 * `!response.ok` is the more idiomatic and robust check.
 */
export async function fetchUsers(url = USERS_URL) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json()
}
