import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiFetch, setUnauthorizedHandler } from './api.js';

const AuthContext = createContext(null);

const ANONYMOUS = { status: 'anonymous', user: null, expiresAt: null };
// setTimeout fires at once for delays past 2^31 - 1 ms (about 24.8 days).
const MAX_TIMEOUT = 2 ** 31 - 1;

// The server owns the session (HttpOnly cookie); this only mirrors what it says.
export function AuthProvider({ children }) {
  const [session, setSession] = useState({ status: 'loading', user: null, expiresAt: null });

  const endSession = useCallback(() => setSession(ANONYMOUS), []);
  const startSession = useCallback(({ user, expiresAt }) => {
    setSession({ status: 'authenticated', user, expiresAt });
    return user;
  }, []);

  // Any 401 from a protected request ends the session in the UI too.
  useEffect(() => setUnauthorizedHandler(endSession), [endSession]);

  // On load, the server says whether the cookie is still a session.
  useEffect(() => {
    const controller = new AbortController();
    apiFetch('/auth/me', { signal: controller.signal })
      .then(startSession)
      .catch((error) => {
        if (error.name !== 'AbortError') endSession();
      });
    return () => controller.abort();
  }, [startSession, endSession]);

  // The cookie dies at expiresAt; the UI follows without waiting for a 401.
  useEffect(() => {
    if (!session.expiresAt) return undefined;
    const delay = Math.min(new Date(session.expiresAt) - Date.now(), MAX_TIMEOUT);
    const timer = setTimeout(endSession, delay);
    return () => clearTimeout(timer);
  }, [session.expiresAt, endSession]);

  const logIn = useCallback(
    async (username, password) =>
      startSession(await apiFetch('/auth/login', { method: 'POST', body: { username, password } })),
    [startSession]
  );

  const signUp = useCallback(
    async (username, password) =>
      startSession(await apiFetch('/auth/signup', { method: 'POST', body: { username, password } })),
    [startSession]
  );

  // The browser cannot delete an HttpOnly cookie: the API answers with an expired one.
  const logOut = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } finally {
      endSession();
    }
  }, [endSession]);

  const value = useMemo(
    () => ({ ...session, logIn, signUp, logOut }),
    [session, logIn, signUp, logOut]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
