import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '@blog/shared/auth';
import { useDocumentTitle } from '@blog/shared/useDocumentTitle';

// Same rules as the API validators; the API still checks them.
const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;
const MIN_PASSWORD = 8;

export function validateSignup({ username, password }) {
  const errors = {};
  if (!USERNAME_PATTERN.test(username)) errors.username = 'Use 3 to 20 lowercase letters, numbers or _.';
  if (password.length < MIN_PASSWORD) errors.password = `Use at least ${MIN_PASSWORD} characters.`;
  return errors;
}

export function SignupPage() {
  const { status, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from ?? '/';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Create an account');

  if (status === 'authenticated' && !busy) return <Navigate to={from} replace />;

  async function submit(event) {
    event.preventDefault();
    setFormError(null);
    const found = validateSignup({ username, password });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await signUp(username, password);
      navigate(from, { replace: true });
    } catch (err) {
      if (err.status === 409) setErrors({ username: err.message });
      else if (err.status === 422 && err.details) setErrors(err.details);
      else setFormError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="auth ui">
      <p className="kicker">Join the readers</p>
      <h1 className="display">Create an account</h1>
      <p className="meta lead">An account lets you leave notes. Only the editors can publish essays.</p>
      <form onSubmit={submit} noValidate>
        {formError && (
          <p className="alert" role="alert">
            {formError}
          </p>
        )}
        <div className="field">
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            className="input"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            maxLength={20}
            aria-invalid={errors.username ? 'true' : undefined}
            aria-describedby="signup-username-hint"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase())}
          />
          {errors.username && <p className="error">{errors.username}</p>}
          <p id="signup-username-hint" className="hint">
            3 to 20 characters: lowercase letters, numbers or _
          </p>
        </div>
        <div className="field">
          <label htmlFor="signup-password">Password</label>
          <input
            id="signup-password"
            className="input"
            type="password"
            autoComplete="new-password"
            aria-invalid={errors.password ? 'true' : undefined}
            aria-describedby="signup-password-hint"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="error">{errors.password}</p>}
          <p id="signup-password-hint" className="hint">
            At least 8 characters.
          </p>
        </div>
        <button type="submit" className="btn" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="switch">
        Already a reader?{' '}
        <Link to="/login" state={location.state}>
          Log in
        </Link>
      </p>
      <p className="fleuron gap" aria-hidden="true">
        {'\u2766\uFE0E'}
      </p>
    </div>
  );
}
