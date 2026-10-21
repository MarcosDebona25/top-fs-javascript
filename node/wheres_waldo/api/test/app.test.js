const { request, prisma, createTestApp } = require('./helpers');
const { loadConfig } = require('../src/lib/env');

let app;

beforeAll(() => {
  ({ app } = createTestApp());
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe('the app', () => {
  it('answers the health check', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('answers unknown routes with a JSON 404', async () => {
    const res = await request(app).get('/api/nothing-here').expect(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });

  it('sets security headers', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('lets the configured origin read responses with credentials, and nobody else', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['access-control-allow-credentials']).toBe('true');

    const denied = await request(app).get('/api/health').set('Origin', 'https://evil.example');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers the CORS preflight for a JSON POST', async () => {
    const res = await request(app)
      .options('/api/games/00000000-0000-4000-8000-000000000000/guesses')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type')
      .expect(204);
    expect(res.headers['access-control-allow-methods']).toMatch(/POST/);
  });
});

describe('loadConfig', () => {
  const env = { DATABASE_URL: 'postgresql://x', SESSION_SECRET: 'a'.repeat(64), CORS_ORIGINS: 'http://a.test, http://b.test' };

  it('reads the environment and applies the documented defaults', () => {
    expect(loadConfig(env)).toMatchObject({
      CORS_ORIGINS: ['http://a.test', 'http://b.test'],
      SESSION_MAX_AGE_DAYS: 7,
      MIN_GAME_MS: 5000,
      WRONG_GUESS_PENALTY_MS: 1000,
      HIT_MARGIN: 0.005,
      TRUST_PROXY: false,
      COOKIE_SECURE: true,
    });
  });

  it('reads overrides, including turning Secure cookies off', () => {
    const config = loadConfig({ ...env, MIN_GAME_MS: '8000', WRONG_GUESS_PENALTY_MS: '2000', COOKIE_SECURE: 'false', TRUST_PROXY: '1' });
    expect(config).toMatchObject({ MIN_GAME_MS: 8000, WRONG_GUESS_PENALTY_MS: 2000, COOKIE_SECURE: false, TRUST_PROXY: 1 });
  });

  it('refuses to start without the required variables', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL, SESSION_SECRET, CORS_ORIGINS/);
  });

  it('refuses a weak session secret', () => {
    expect(() => loadConfig({ ...env, SESSION_SECRET: 'short' })).toThrow(/at least 64/);
  });

  it('refuses nonsense numbers', () => {
    expect(() => loadConfig({ ...env, MIN_GAME_MS: 'soon' })).toThrow(/MIN_GAME_MS/);
    expect(() => loadConfig({ ...env, WRONG_GUESS_PENALTY_MS: '-1' })).toThrow(/WRONG_GUESS_PENALTY_MS/);
    expect(() => loadConfig({ ...env, TRUST_PROXY: 'yes' })).toThrow(/TRUST_PROXY/);
  });
});
