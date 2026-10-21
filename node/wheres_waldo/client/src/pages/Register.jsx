import { useEffect, useId, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useAuth } from '../auth.jsx';
import { AlertIcon, CheckIcon, SpinnerIcon } from '../components/icons.jsx';
import { isBlocking, useUsernameCheck } from '../hooks/useUsernameCheck.js';
import { validatePassword } from '../lib/validation.js';

const BENEFITS = ['Your times on all three scenes, ranked globally', 'Replay to beat your own record', 'No email needed'];

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';
  const id = useId();
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const refs = { username: useRef(null), password: useRef(null), confirmPassword: useRef(null) };
  const check = useUsernameCheck(form.username.trim());

  useEffect(() => {
    document.title = "Sign up · Where's Waldo?";
  }, []);

  if (user && !busy) return <Navigate to={from} replace />;

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setServerErrors((current) => ({ ...current, [field]: undefined }));
    setFormError(null);
  };

  const username = form.username.trim();
  const usernameState = serverErrors.username ? 'taken' : check.state;
  const usernameMessage = serverErrors.username || check.message;
  const passwordProblem = validatePassword(form.password);
  const passwordShown = form.password === '' ? (passwordTouched ? 'error' : 'idle') : passwordProblem ? (passwordTouched ? 'error' : 'idle') : 'ok';
  const mismatch = form.confirmPassword !== '' && form.confirmPassword !== form.password;
  const confirmError = serverErrors.confirmPassword || (mismatch ? "Passwords don't match" : null);
  const passwordError = serverErrors.password;

  async function submit(event) {
    event.preventDefault();
    setPasswordTouched(true);
    setFormError(null);
    const problems = [];
    if (username === '' || isBlocking(check.state)) problems.push('username');
    else if (passwordProblem || passwordError) problems.push('password');
    else if (form.confirmPassword !== form.password) problems.push('confirmPassword');
    if (username === '') setServerErrors((current) => ({ ...current, username: 'Choose a username' }));
    if (problems.length) {
      refs[problems[0]].current?.focus();
      return;
    }
    setBusy(true);
    try {
      await register({ username, password: form.password, confirmPassword: form.confirmPassword });
      navigate(from, { replace: true });
    } catch (failure) {
      setBusy(false);
      if (failure.status === 429) setFormError('Too many attempts. Wait a few minutes and try again.');
      else if (Object.keys(failure.errors).length) {
        setServerErrors(failure.errors);
        refs[Object.keys(failure.errors)[0]]?.current?.focus();
      } else setFormError(failure.message);
    }
  }

  return (
    <div className="container auth auth--top">
      <div className="auth__intro">
        <h1 className="display auth__title">
          Put your name <span className="accent">on the board.</span>
        </h1>
        <p className="auth__copy">
          An account is just a username and a password. Your best time on each scene is saved and ranked against everyone else.
        </p>
        <ul className="benefits">
          {BENEFITS.map((benefit) => (
            <li key={benefit}>
              <span className="benefits__tick">
                <CheckIcon size={20} />
              </span>
              {benefit}
            </li>
          ))}
        </ul>
      </div>

      <form className="form" noValidate onSubmit={submit}>
        <h2 className="form__title">Create account</h2>

        <div className="field">
          <label className="field__label" htmlFor={`${id}-username`}>
            Username
          </label>
          <input
            id={`${id}-username`}
            ref={refs.username}
            className={`input${usernameState === 'available' ? ' input--ok' : ''}`}
            type="text"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            value={form.username}
            onChange={update('username')}
            aria-invalid={usernameState === 'invalid' || usernameState === 'taken' ? 'true' : 'false'}
            aria-describedby={`${id}-username-msg ${id}-username-hint`}
          />
          <p
            id={`${id}-username-msg`}
            role="status"
            className={`msg ${usernameState === 'available' ? 'msg--ok' : usernameState === 'taken' || usernameState === 'invalid' ? 'msg--error' : 'msg--pending'}`}
          >
            {usernameState === 'available' && <CheckIcon />}
            {(usernameState === 'taken' || usernameState === 'invalid') && <AlertIcon />}
            {usernameState === 'checking' && <SpinnerIcon />}
            <span>{usernameMessage}</span>
          </p>
          <p id={`${id}-username-hint`} className="hint">
            3–20 characters: letters, numbers, _ or -
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor={`${id}-password`}>
            Password
          </label>
          <input
            id={`${id}-password`}
            ref={refs.password}
            className="input"
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={update('password')}
            onBlur={() => setPasswordTouched(true)}
            aria-invalid={passwordShown === 'error' || passwordError ? 'true' : 'false'}
            aria-describedby={`${id}-password-msg`}
          />
          <p
            id={`${id}-password-msg`}
            className={`msg ${passwordError || passwordShown === 'error' ? 'msg--error' : passwordShown === 'ok' ? 'msg--ok' : 'msg--pending'}`}
          >
            {passwordError || passwordShown === 'error' ? <AlertIcon /> : <CheckIcon />}
            {passwordError || (passwordShown === 'error' && passwordProblem) || 'At least 8 characters'}
          </p>
        </div>

        <div className="field">
          <label className="field__label" htmlFor={`${id}-confirm`}>
            Confirm password
          </label>
          <input
            id={`${id}-confirm`}
            ref={refs.confirmPassword}
            className="input"
            type="password"
            name="confirmPassword"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={update('confirmPassword')}
            aria-invalid={confirmError ? 'true' : 'false'}
            aria-describedby={confirmError ? `${id}-confirm-msg` : undefined}
          />
          {confirmError && (
            <p id={`${id}-confirm-msg`} role="alert" className="msg msg--error">
              <AlertIcon />
              {confirmError}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="msg msg--error">
            <AlertIcon />
            {formError}
          </p>
        )}

        <button type="submit" className="btn btn--primary form__submit" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <div className="form__links">
          <span>
            Already have an account? <Link to="/login" state={{ from }}>Log in</Link>
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
