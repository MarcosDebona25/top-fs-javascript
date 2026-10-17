import { describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch, setUnauthorizedHandler } from './api.js';
import { jsonResponse, stubApi } from '../../test/fetch.js';

describe('apiFetch', () => {
  it('sends the cookie and no custom header on reads', async () => {
    const fetch = stubApi({ 'GET /posts': [200, { posts: [] }] });
    await expect(apiFetch('/posts')).resolves.toEqual({ posts: [] });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('http://api.test/api/posts');
    expect(init.credentials).toBe('include');
    expect(init.headers).toEqual({});
  });

  it('marks writes with X-Requested-With and sends JSON', async () => {
    const fetch = stubApi({ 'POST /posts': [201, { post: { id: 1 } }] });
    await apiFetch('/posts', { method: 'POST', body: { title: 'T' } });

    const [, init] = fetch.mock.calls[0];
    expect(init.headers).toEqual({ 'X-Requested-With': 'blog-client', 'Content-Type': 'application/json' });
    expect(init.body).toBe('{"title":"T"}');
  });

  it('returns null on 204', async () => {
    stubApi({ 'DELETE /posts/1': [204] });
    await expect(apiFetch('/posts/1', { method: 'DELETE' })).resolves.toBeNull();
  });

  it('turns error bodies into ApiError with status and details', async () => {
    stubApi({ 'POST /auth/signup': [422, { error: 'Validation failed', details: { username: 'Taken' } }] });
    const error = await apiFetch('/auth/signup', { method: 'POST', body: {} }).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 422, message: 'Validation failed', details: { username: 'Taken' } });
  });

  it('uses a generic message when the body is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 502 })));
    await expect(apiFetch('/posts')).rejects.toMatchObject({ status: 502, message: 'Something went wrong.' });
  });

  it('reports a network failure as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))));
    await expect(apiFetch('/posts')).rejects.toMatchObject({ status: 0 });
  });

  it('lets an abort through untouched', async () => {
    const abort = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(abort)));
    await expect(apiFetch('/posts')).rejects.toBe(abort);
  });

  it('calls the unauthorized handler on a 401, except for /auth routes', async () => {
    const handler = vi.fn();
    setUnauthorizedHandler(handler);
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(401, { error: 'Unauthorized' })));

    await expect(apiFetch('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();

    await expect(apiFetch('/me/posts')).rejects.toMatchObject({ status: 401 });
    expect(handler).toHaveBeenCalledOnce();
    setUnauthorizedHandler(() => {});
  });
});
