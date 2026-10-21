import { describe, expect, it } from 'vitest';
import { validatePassword, validateUsername } from './validation.js';

describe('validateUsername', () => {
  it('says nothing about an empty field', () => {
    expect(validateUsername('')).toBeNull();
  });

  it('accepts letters, numbers, underscore and dash within 3–20 characters', () => {
    expect(validateUsername('pom_pom-1')).toBeNull();
    expect(validateUsername('abc')).toBeNull();
    expect(validateUsername('a'.repeat(20))).toBeNull();
  });

  it('explains what is wrong', () => {
    expect(validateUsername('po')).toBe('Use at least 3 characters');
    expect(validateUsername('a'.repeat(21))).toBe('Use at most 20 characters');
    expect(validateUsername('pom pom')).toBe('Use only letters, numbers, _ or -');
    expect(validateUsername('pompóm')).toBe('Use only letters, numbers, _ or -');
  });
});

describe('validatePassword', () => {
  it('needs 8 characters', () => {
    expect(validatePassword('1234567')).toBe('At least 8 characters');
    expect(validatePassword('12345678')).toBeNull();
  });

  it('counts bytes against the 72 byte limit', () => {
    expect(validatePassword('a'.repeat(72))).toBeNull();
    expect(validatePassword('a'.repeat(73))).toBe('At most 72 bytes');
    expect(validatePassword('é'.repeat(37))).toBe('At most 72 bytes');
  });
});
