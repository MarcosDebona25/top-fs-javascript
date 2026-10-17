// Its own file: node --test runs each file in a separate process, so this one starts with a fresh limiter.
const { after, it } = require('node:test');
const assert = require('node:assert/strict');
const { request, app, prisma, write } = require('./helpers');

after(() => prisma.$disconnect());

it('blocks the 11th login attempt within 15 minutes', async () => {
  const attempt = () => write(request(app).post('/api/auth/login')).send({ username: 'author1', password: 'wrong-pass' });
  for (let i = 0; i < 10; i += 1) assert.equal((await attempt()).status, 401);
  const blocked = await attempt();
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.error, 'Too many attempts. Try again later.');
});
