import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';
import { AuthProvider } from '../src/auth.jsx';

// A reply with a status; a plain object is a 200 with that body, null is a 204.
export const reply = (status, body = {}) => ({ __reply: true, status, body });

// Replaces fetch with a table of "METHOD /path" -> reply (or function returning one). Unlisted calls are 404s.
// `GET /api/auth/me` defaults to a guest.
export function mockApi(handlers = {}) {
  const calls = [];
  const table = { 'GET /api/auth/me': { user: null }, ...handlers };
  const fetchMock = vi.fn(async (input, init = {}) => {
    const url = new URL(String(input), 'http://localhost');
    const method = (init.method || 'GET').toUpperCase();
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path: url.pathname, search: url.search, body });
    const handler = table[`${method} ${url.pathname}${url.search}`] ?? table[`${method} ${url.pathname}`];
    let result = handler === undefined ? reply(404, { error: `Not mocked: ${method} ${url.pathname}` }) : handler;
    if (typeof result === 'function') result = await result({ body, url });
    const { status, payload } = result && result.__reply ? { status: result.status, payload: result.body } : { status: result === null ? 204 : 200, payload: result };
    return { ok: status >= 200 && status < 300, status, json: async () => payload };
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock, called: (method, path) => calls.filter((call) => call.method === method && call.path === path) };
}

// Renders `routes` (an element tree of <Route>) at `route`, with the auth provider the app uses.
export function renderRoutes(routes, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <Routes>{routes}</Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

export function renderPage(element, { route = '/', path = '*' } = {}) {
  return renderRoutes(<Route path={path} element={element} />, { route });
}

export const user = (username = 'pompom') => ({ user: { id: 'u1', username } });
