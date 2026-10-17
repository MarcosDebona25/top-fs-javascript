import { describe, expect, it } from 'vitest';
import { validateSignup } from './SignupPage.jsx';

describe('validateSignup', () => {
  it('accepts the same usernames the API accepts', () => {
    expect(validateSignup({ username: 'new_reader9', password: 'long enough' })).toEqual({});
  });

  it('rejects uppercase, spaces and wrong lengths', () => {
    for (const username of ['ab', 'Reader', 'with space', 'x'.repeat(21)]) {
      expect(validateSignup({ username, password: 'long enough' })).toHaveProperty('username');
    }
  });

  it('asks for at least 8 characters of password', () => {
    expect(validateSignup({ username: 'reader', password: 'short' })).toEqual({
      password: 'Use at least 8 characters.',
    });
  });
});
