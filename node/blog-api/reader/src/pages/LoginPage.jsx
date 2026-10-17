import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@blog/shared/auth';
import { useDocumentTitle } from '@blog/shared/useDocumentTitle';

function loginError(error) {
  if (error.status === 401) return 'Invalid username or password.';
  if (error.status === 422) return 'Enter your username and password.';
  return error.message;
}

export function LoginPage() {
  const { status, logIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Log in');

  if (status === 'authenticated' && !busy) return <Navigate to={from} replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await logIn(username.trim().toLowerCase(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(loginError(err));
      setBusy(false);
    }
  }

  return (
    <div className="auth ui">
      <p className="kicker">Welcome back</p>
      <h1 className="display">Log in</h1>
      <p className="meta lead">Log in to leave notes in the margin.</p>
      <form onSubmit={submit} noValidate>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <div className="field">
          <label htmlFor="login-username">Username</label>
          <input
            id="login-username"
            className="input"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            className="input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="switch">
        New here?{' '}
        <Link to="/signup" state={location.state}>
          Create an account
        </Link>
      </p>
      <p className="fleuron gap" aria-hidden="true">
        {'\u2766\uFE0E'}
      </p>
    </div>
  );
}
