import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './lib/api.js';

const AuthContext = createContext(null);

// Who is playing: a registered player (session cookie) or a guest. `status` is 'loading' until the first answer.
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    const controller = new AbortController();
    api
      .me({ signal: controller.signal })
      .then(({ user }) => setState({ status: 'ready', user }))
      .catch((error) => {
        if (error.name !== 'AbortError') setState({ status: 'ready', user: null });
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (credentials) => {
    const { user } = await api.login(credentials);
    setState({ status: 'ready', user });
    return user;
  }, []);

  const register = useCallback(async (details) => {
    const { user } = await api.register(details);
    setState({ status: 'ready', user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setState({ status: 'ready', user: null });
    }
  }, []);

  const value = useMemo(() => ({ ...state, login, register, logout }), [state, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
