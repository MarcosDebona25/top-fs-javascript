import { vi } from 'vitest';

export function jsonResponse(status, body) {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Replaces fetch with a table of "METHOD /path" → [status, body]; anything else fails the test.
export function stubApi(routes) {
  const fetch = vi.fn(async (url, init = {}) => {
    const path = new URL(url).pathname.replace(/^\/api/, '');
    const key = `${init.method ?? 'GET'} ${path}`;
    if (!(key in routes)) throw new Error(`Unexpected request: ${key}`);
    const [status, body] = typeof routes[key] === 'function' ? routes[key](init) : routes[key];
    return jsonResponse(status, body);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
