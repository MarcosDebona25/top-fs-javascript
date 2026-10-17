import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@blog/shared/auth';

export function SessionDialog({ username, onDismiss }) {
  const { logIn } = useAuth();
  const dialog = useRef(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // showModal() traps focus and makes the rest of the page inert; Escape dismisses it.
  useEffect(() => {
    dialog.current.showModal();
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await logIn(username, password);
    } catch (err) {
      setError(err.status === 401 ? 'That password didn’t work.' : err.message);
      setBusy(false);
    }
  }

  return (
    <dialog
      ref={dialog}
      className="session-dialog ui"
      aria-labelledby="session-title"
      onCancel={(event) => {
        event.preventDefault();
        onDismiss();
      }}
    >
      <p className="kicker">Session expired</p>
      <h2 id="session-title" className="display">
        Log in to save your draft
      </h2>
      <p>Your hour on the desk ran out. The draft is kept on this device, so nothing is lost.</p>
      <form onSubmit={submit}>
        <p>
          Logging in as <strong>{username}</strong>
        </p>
        <div className="field">
          <label htmlFor="session-password">Password</label>
          <input
            id="session-password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="buttons">
          <button type="submit" className="btn" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in and save'}
          </button>
          <button type="button" className="btn-link muted" onClick={onDismiss}>
            Not now
          </button>
        </div>
      </form>
    </dialog>
  );
}
