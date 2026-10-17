const { after, describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { request, app, prisma, write, logIn, passwords } = require('./helpers');

const username = `t_${Date.now().toString(36)}`;

after(async () => {
  await prisma.user.deleteMany({ where: { username } });
  await prisma.$disconnect();
});

describe('POST /api/auth/signup', () => {
  it('creates a READER and opens a session in an HttpOnly cookie', async () => {
    const res = await write(request(app).post('/api/auth/signup'))
      .send({ username, password: 'a long password' })
      .expect(201);

    assert.equal(res.body.user.username, username);
    assert.equal(res.body.user.role, 'READER');
    assert.equal(res.body.token, undefined, 'the token never travels in the body');
    assert.equal(res.body.user.passwordHash, undefined);
    const cookie = res.headers['set-cookie'][0];
    assert.match(cookie, /^token=/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
  });

  it('answers 409 for a username that is taken', async () => {
    await write(request(app).post('/api/auth/signup')).send({ username, password: 'a long password' }).expect(409);
  });

  it('answers 422 with one message per invalid field', async () => {
    const res = await write(request(app).post('/api/auth/signup'))
      .send({ username: 'No Spaces', password: 'short' })
      .expect(422);
    assert.ok(res.body.details.username);
    assert.ok(res.body.details.password);
  });
});

describe('POST /api/auth/login', () => {
  it('gives the same 401 for a wrong password and an unknown user', async () => {
    const wrong = await write(request(app).post('/api/auth/login')).send({ username: 'author1', password: 'nope-nope' });
    const unknown = await write(request(app).post('/api/auth/login')).send({ username: 'nobody_here', password: 'nope-nope' });
    assert.equal(wrong.status, 401);
    assert.equal(unknown.status, 401);
    assert.deepEqual(wrong.body, unknown.body);
  });
});

describe('GET /api/auth/me and logout', () => {
  it('needs a session', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });

  it('returns the user behind the cookie, and rejects a tampered one', async () => {
    const cookie = await logIn('author1', passwords.author);
    const res = await request(app).get('/api/auth/me').set('Cookie', cookie).expect(200);
    assert.equal(res.body.user.username, 'author1');
    assert.equal(res.body.user.role, 'AUTHOR');
    assert.ok(Date.parse(res.body.expiresAt) > Date.now());

    await request(app).get('/api/auth/me').set('Cookie', `${cookie}x`).expect(401);
  });

  it('logs out by sending back an expired cookie', async () => {
    const cookie = await logIn('reader1', passwords.reader);
    const res = await write(request(app).post('/api/auth/logout')).set('Cookie', cookie).expect(204);
    assert.match(res.headers['set-cookie'][0], /token=;.*Expires=Thu, 01 Jan 1970/);
  });
});
