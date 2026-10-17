const API_URL = import.meta.env.VITE_API_URL;

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let onUnauthorized = () => {};

// AuthProvider registers what to do when a request comes back 401.
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

export async function apiFetch(path, { method = 'GET', body, signal } = {}) {
  const headers = {};
  // The CSRF guard only checks writes; on reads the header would only add a preflight.
  if (method !== 'GET') headers['X-Requested-With'] = 'blog-client';
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'The server did not answer. Check your connection and try again.');
  }

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (response.ok) return data;

  // A 401 outside /auth means the session ended (expired or logged out elsewhere).
  if (response.status === 401 && !path.startsWith('/auth/')) onUnauthorized();
  throw new ApiError(response.status, data.error ?? 'Something went wrong.', data.details);
}
