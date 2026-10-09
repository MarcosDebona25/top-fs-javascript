'use strict';

// Single source of truth for validation rules. Loaded by Node (require) and by
// the browser (served as /js/rules.js, exposes window.Rules), so the inline
// checks and the server checks can never drift apart.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Rules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function byteLength(str) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(str).length;
    return Buffer.byteLength(str, 'utf8');
  }

  function required(value, label, max) {
    const v = String(value ?? '').trim();
    if (!v) return `${label} is required.`;
    if (v.length > max) return `${label} must be at most ${max} characters.`;
    return null;
  }

  // Each requirement is {id, label, test}; the UI renders them as a live checklist.
  const PASSWORD_REQUIREMENTS = [
    { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
    { id: 'upper', label: 'At least 1 uppercase letter', test: (v) => /[A-Z]/.test(v) },
    { id: 'digit', label: 'At least 1 number', test: (v) => /\d/.test(v) },
  ];

  function validateFirstName(v) {
    return required(v, 'First name', 50);
  }

  function validateLastName(v) {
    return required(v, 'Last name', 50);
  }

  function validateEmail(v) {
    const value = String(v ?? '').trim();
    if (!value) return 'Email is required.';
    if (value.length > 254 || !EMAIL_RE.test(value)) return 'Enter a valid email address.';
    return null;
  }

  function validatePassword(v) {
    const value = String(v ?? '');
    if (!value) return 'Password is required.';
    const failed = PASSWORD_REQUIREMENTS.find((r) => !r.test(value));
    if (failed) return `Password must have: ${failed.label.toLowerCase()}.`;
    // bcrypt silently ignores bytes beyond 72.
    if (byteLength(value) > 72) return 'Password must be at most 72 bytes.';
    return null;
  }

  function validateConfirm(password, confirm) {
    if (!confirm) return 'Please confirm your password.';
    if (password !== confirm) return 'Passwords do not match.';
    return null;
  }

  function validateTitle(v) {
    return required(v, 'Title', 100);
  }

  function validateText(v) {
    return required(v, 'Message', 1000);
  }

  function validatePasscode(v) {
    return String(v ?? '').trim() ? null : 'Passcode is required.';
  }

  return {
    PASSWORD_REQUIREMENTS,
    validateFirstName,
    validateLastName,
    validateEmail,
    validatePassword,
    validateConfirm,
    validateTitle,
    validateText,
    validatePasscode,
  };
});
