import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@blog/shared/auth';
import { useDocumentTitle } from '@blog/shared/useDocumentTitle';
import { DeskMasthead } from '../components/DeskMasthead.jsx';
import { DeskFooter } from '../components/DeskFooter.jsx';

export function LoginPage() {
  const { status, user, logIn, logOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Log in', 'The desk');

  if (status === 'authenticated' && user.role === 'AUTHOR' && !busy) return <Navigate to={from} replace />;

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const loggedIn = await logIn(username.trim().toLowerCase(), password);
      // The API lets readers log in too; the desk turns them away and closes the session it just opened.
      if (loggedIn.role !== 'AUTHOR') {
        await logOut();
        setError('This is a reader account. The desk is only for authors.');
        setBusy(false);
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.status === 401 ? 'Invalid username or password.' : err.message);
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <DeskMasthead user={null} />
      <main className="wrap">
        <div className="auth ui">
          <p className="kicker">The writers’ desk</p>
          <h1 className="display">Log in</h1>
          <p className="meta lead">For the authors of Marginalia. Readers log in on the site.</p>
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? 'Logging in…' : 'Log in'}
            </button>
          </form>
        </div>
      </main>
      <DeskFooter user={null} />
    </div>
  );
}
