export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error || `Request failed (${status})`);
    this.name = 'ApiError';
    this.status = status;
    this.code = body?.code;
    this.errors = body?.errors ?? {};
    this.body = body ?? {};
  }
}

// The client only ever calls its own origin; Vite (dev) or the host (deploy) forwards /api to the API.
export async function request(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, { error: 'Cannot reach the server. Check your connection and try again.', code: 'NETWORK' });
  }
  if (response.status === 204) return null;
  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok) throw new ApiError(response.status, data);
  return data;
}

export const api = {
  me: (options) => request('/auth/me', options),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  usernameAvailable: (username, options) => request(`/auth/username-available?username=${encodeURIComponent(username)}`, options),
  maps: (options) => request('/maps', options),
  map: (slug, options) => request(`/maps/${slug}`, options),
  startGame: (slug) => request(`/maps/${slug}/games`, { method: 'POST' }),
  game: (id, options) => request(`/games/${id}`, options),
  guess: (id, body) => request(`/games/${id}/guesses`, { method: 'POST', body }),
  quitGame: (id) => request(`/games/${id}/quit`, { method: 'POST' }),
  summary: (options) => request('/leaderboards/summary', options),
  globalBoard: ({ page = 1, pageSize = 10 } = {}, options) => request(`/leaderboards/global?page=${page}&pageSize=${pageSize}`, options),
  mapBoard: (slug, { page = 1, pageSize = 10 } = {}, options) =>
    request(`/leaderboards/maps/${slug}?page=${page}&pageSize=${pageSize}`, options),
};
