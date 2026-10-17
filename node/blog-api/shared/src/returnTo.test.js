import { describe, expect, it } from 'vitest';
import { returnTo } from './returnTo.js';

describe('returnTo', () => {
  it('remembers the current page', () => {
    expect(returnTo({ pathname: '/posts/3', state: null })).toEqual({ from: '/posts/3' });
  });

  it('keeps the original page when moving between login and signup', () => {
    const state = { from: '/posts/3' };
    expect(returnTo({ pathname: '/login', state })).toBe(state);
    expect(returnTo({ pathname: '/signup', state })).toBe(state);
  });
});
