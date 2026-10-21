import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockApi } from '../../test/helpers.jsx';
import { useUsernameCheck } from './useUsernameCheck.js';

describe('useUsernameCheck', () => {
  it('does nothing for an empty field', () => {
    const api = mockApi();
    const { result } = renderHook(() => useUsernameCheck('', { delayMs: 0 }));
    expect(result.current.state).toBe('idle');
    expect(api.calls).toHaveLength(0);
  });

  it('rejects a bad format without asking the server', () => {
    const api = mockApi();
    const { result } = renderHook(() => useUsernameCheck('po', { delayMs: 0 }));
    expect(result.current).toEqual({ state: 'invalid', message: 'Use at least 3 characters' });
    expect(api.calls).toHaveLength(0);
  });

  it('checks availability after the pause', async () => {
    mockApi({ 'GET /api/auth/username-available?username=pompom': { username: 'pompom', available: true } });
    const { result } = renderHook(() => useUsernameCheck('pompom', { delayMs: 5 }));
    expect(result.current.state).toBe('checking');
    await waitFor(() => expect(result.current.state).toBe('available'));
    expect(result.current.message).toBe('pompom is available');
  });

  it('reports a taken name', async () => {
    mockApi({ 'GET /api/auth/username-available?username=stripe_seeker': { username: 'stripe_seeker', available: false } });
    const { result } = renderHook(() => useUsernameCheck('stripe_seeker', { delayMs: 5 }));
    await waitFor(() => expect(result.current.state).toBe('taken'));
  });

  it('only asks once the typing stops', async () => {
    const api = mockApi({ 'GET /api/auth/username-available': { available: true } });
    const { rerender } = renderHook(({ name }) => useUsernameCheck(name, { delayMs: 30 }), { initialProps: { name: 'pom' } });
    rerender({ name: 'pomp' });
    rerender({ name: 'pompo' });
    await waitFor(() => expect(api.called('GET', '/api/auth/username-available')).toHaveLength(1));
    expect(api.calls.at(-1).search).toBe('?username=pompo');
  });

  it('says so when the check itself fails', async () => {
    mockApi({ 'GET /api/auth/username-available': () => { throw new Error('boom'); } });
    const { result } = renderHook(() => useUsernameCheck('pompom', { delayMs: 1 }));
    await waitFor(() => expect(result.current.state).toBe('unknown'));
  });
});
