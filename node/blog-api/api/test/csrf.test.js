const { after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { request, app, prisma } = require('./helpers');

after(() => prisma.$disconnect());

const body = { username: 'author1', password: 'whatever1' };

describe('CSRF guard on writes', () => {
  it('rejects a write without Origin', async () => {
    const res = await request(app).post('/api/auth/login').set('X-Requested-With', 'blog-client').send(body);
    assert.equal(res.status, 403);
  });

  it('rejects an Origin outside the allowlist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'https://evil.example')
      .set('X-Requested-With', 'blog-client')
      .send(body);
    assert.equal(res.status, 403);
  });

  it('rejects a write without the client header', async () => {
    const res = await request(app).post('/api/auth/login').set('Origin', 'http://localhost:5173').send(body);
    assert.equal(res.status, 403);
  });

  it('rejects a cross-site request even from an allowed Origin', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'http://localhost:5173')
      .set('X-Requested-With', 'blog-client')
      .set('Sec-Fetch-Site', 'cross-site')
      .send(body);
    assert.equal(res.status, 403);
  });

  it('leaves reads alone', async () => {
    await request(app).get('/api/posts').expect(200);
  });
});

describe('CORS', () => {
  it('answers the preflight for an allowed origin with credentials', async () => {
    const res = await request(app)
      .options('/api/posts')
      .set('Origin', 'http://localhost:5174')
      .set('Access-Control-Request-Method', 'PATCH')
      .set('Access-Control-Request-Headers', 'content-type,x-requested-with');
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5174');
    assert.equal(res.headers['access-control-allow-credentials'], 'true');
  });

  it('gives no CORS headers to other origins', async () => {
    const res = await request(app).get('/api/posts').set('Origin', 'https://evil.example');
    assert.equal(res.headers['access-control-allow-origin'], undefined);
  });
});
