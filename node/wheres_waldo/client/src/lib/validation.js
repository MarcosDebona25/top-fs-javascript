// The same rules as the API; the server stays the authority, these only give feedback while typing.
export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX_BYTES = 72;

// Returns the message to show, or null when the username is fine (or still empty).
export function validateUsername(value) {
  if (value === '') return null;
  if (!/^[A-Za-z0-9_-]*$/.test(value)) return 'Use only letters, numbers, _ or -';
  if (value.length < USERNAME_MIN) return `Use at least ${USERNAME_MIN} characters`;
  if (value.length > USERNAME_MAX) return `Use at most ${USERNAME_MAX} characters`;
  return null;
}

export function validatePassword(value) {
  if (value.length < PASSWORD_MIN) return `At least ${PASSWORD_MIN} characters`;
  if (new TextEncoder().encode(value).length > PASSWORD_MAX_BYTES) return `At most ${PASSWORD_MAX_BYTES} bytes`;
  return null;
}
