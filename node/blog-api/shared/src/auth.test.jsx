import { describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth.jsx';
import { apiFetch } from './api.js';
import { stubApi } from '../../test/fetch.js';

function Probe() {
  const { status, user } = useAuth();
  return <p>{status === 'authenticated' ? `in as ${user.username}` : status}</p>;
}

const session = { user: { id: 1, username: 'reader1', role: 'READER' }, expiresAt: '2099-01-01T00:00:00Z' };

describe('AuthProvider', () => {
  it('starts as loading and becomes anonymous when /auth/me says 401', async () => {
    stubApi({ 'GET /auth/me': [401, { error: 'Unauthorized' }] });
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(await screen.findByText('anonymous')).toBeInTheDocument();
  });

  it('restores the session the cookie still holds', async () => {
    stubApi({ 'GET /auth/me': [200, session] });
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(await screen.findByText('in as reader1')).toBeInTheDocument();
  });

  it('ends the session when expiresAt passes, without waiting for a 401', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    stubApi({ 'GET /auth/me': [200, { ...session, expiresAt }] });
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText('in as reader1');

    await act(() => vi.advanceTimersByTimeAsync(60 * 60 * 1000 - 1000));
    expect(screen.getByText('in as reader1')).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('anonymous')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('keeps a far-off expiry from firing at once', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubApi({ 'GET /auth/me': [200, session] });
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText('in as reader1');
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByText('in as reader1')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('ends the session when any protected request gets a 401', async () => {
    stubApi({ 'GET /auth/me': [200, session], 'GET /me/posts': [401, { error: 'Unauthorized' }] });
    render(<AuthProvider><Probe /></AuthProvider>);
    await screen.findByText('in as reader1');

    await act(() => apiFetch('/me/posts').catch(() => {}));
    expect(screen.getByText('anonymous')).toBeInTheDocument();
  });

  it('throws when used outside the provider', () => {
    expect(() => render(<Probe />)).toThrow('useAuth must be used inside <AuthProvider>');
  });
});
