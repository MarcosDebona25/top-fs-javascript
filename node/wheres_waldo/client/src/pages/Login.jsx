import { useEffect, useId, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';
import { AlertIcon } from '../components/icons.jsx';
import { characterImage } from '../lib/maps.js';

export function describeAuthError(error) {
  if (error.status === 429) return 'Too many attempts. Wait a few minutes and try again.';
  if (error.status === 401) return 'Wrong username or password.';
  return error.message || 'Something went wrong. Try again.';
}

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const id = useId();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Log in · Where's Waldo?";
  }, []);

  if (user && !busy) return <Navigate to={from} replace />;

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError(null);
    if (!form.username.trim() || !form.password) {
      setError('Enter your username and password.');
      return;
    }
    setBusy(true);
    try {
      await login({ username: form.username.trim(), password: form.password });
      navigate(from, { replace: true });
    } catch (failure) {
      setError(describeAuthError(failure));
      setBusy(false);
    }
  }

  return (
    <div className="container auth">
      <div className="auth__intro">
        <h1 className="display auth__title">
          Welcome back.
          <br />
          <span className="accent">The clock misses you.</span>
        </h1>
        <div className="auth__cast" aria-hidden="true">
          {['waldo', 'wenda', 'odlaw'].map((slug) => (
            <img key={slug} src={characterImage(slug, 'webp')} alt="" />
          ))}
        </div>
      </div>
      <form className="form" noValidate onSubmit={submit}>
        <h2 className="form__title">Log in</h2>
        <div className="field">
          <label className="field__label" htmlFor={`${id}-username`}>
            Username
          </label>
          <input
            id={`${id}-username`}
            className="input"
            type="text"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            value={form.username}
            onChange={update('username')}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor={`${id}-password`}>
            Password
          </label>
          <input
            id={`${id}-password`}
            className="input"
            type="password"
            name="password"
            autoComplete="current-password"
            value={form.password}
            onChange={update('password')}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${id}-error` : undefined}
          />
          {error && (
            <p id={`${id}-error`} role="alert" className="msg msg--error">
              <AlertIcon />
              {error}
            </p>
          )}
        </div>
        <button type="submit" className="btn btn--primary form__submit" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <div className="form__links">
          <span>
            New here? <Link to="/signup" state={{ from }}>Create an account</Link>
          </span>
          <span>
            Just looking?{' '}
            <Link to="/" className="quiet">
              Continue as a guest
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
}
