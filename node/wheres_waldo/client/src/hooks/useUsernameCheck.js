import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { validateUsername } from '../lib/validation.js';

// Checks a username while the person types: format first (no request), then availability after a short pause.
// state: 'idle' | 'invalid' | 'checking' | 'available' | 'taken' | 'unknown' (the check itself failed).
export function useUsernameCheck(username, { delayMs = 350 } = {}) {
  const [result, setResult] = useState({ username: '', state: 'idle', message: '' });

  useEffect(() => {
    if (username === '') return undefined;
    if (validateUsername(username)) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const { available } = await api.usernameAvailable(username, { signal: controller.signal });
        setResult({ username, state: available ? 'available' : 'taken' });
      } catch (error) {
        if (error.name === 'AbortError') return;
        setResult({ username, state: error.status === 422 ? 'invalid' : 'unknown', message: error.errors?.username || '' });
      }
    }, delayMs);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [username, delayMs]);

  if (username === '') return { state: 'idle', message: '' };
  const local = validateUsername(username);
  if (local) return { state: 'invalid', message: local };
  if (result.username !== username) return { state: 'checking', message: 'Checking availability…' };
  if (result.state === 'available') return { state: 'available', message: `${username} is available` };
  if (result.state === 'taken') return { state: 'taken', message: 'That username is already taken' };
  if (result.state === 'invalid') return { state: 'invalid', message: result.message || 'That username is not valid' };
  return { state: 'unknown', message: "Couldn't check availability right now" };
}

// Lets the form say "taken" after the server refused a submit, without waiting for the next keystroke.
export const isBlocking = (state) => state === 'invalid' || state === 'taken';
