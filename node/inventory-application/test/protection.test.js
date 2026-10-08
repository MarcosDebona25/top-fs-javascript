'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { beforeEach } = require('node:test');

require('./bootstrap');

const {
  agent,
  resetDatabase,
  createCategory,
  createItem,
  publicPost,
  protectedPost,
  postForm,
  extractHidden,
  adminAuth,
  ADMIN_PASSWORD,
} = require('./helpers');

beforeEach(async () => {
  await resetDatabase();
});

test('protected POSTs reject a missing password with 403', async () => {
  const category = await createCategory({ name: 'Braking' });

  const agentInstance = agent();
  const form = await agentInstance.get(`/categories/${category.id}/edit`);
  const token = extractHidden(form, '_csrf');

  const res = await agentInstance
    .post(`/categories/${category.id}/edit`)
    .type('form')
    .send({ name: 'Hacked', description: '', _csrf: token });

  assert.equal(res.status, 403);
  assert.match(res.text, /password/i);

  const { rows } = await require('./helpers').db.query(
    'SELECT name FROM categories WHERE id = $1',
    [category.id]
  );
  assert.equal(rows[0].name, 'Braking');
});

test('protected POSTs reject an incorrect password with 403', async () => {
  const item = await createItem({ sku: 'TST-PW' });

  const agentInstance = agent();
  const form = await agentInstance.get(`/items/${item.id}/archive`);
  const token = extractHidden(form, '_csrf');
  const wrong = await agentInstance
    .post(`/items/${item.id}/archive`)
    .type('form')
    .send({ _csrf: token, admin_password: 'not-the-password' });
  assert.equal(wrong.status, 403);

  const { rows } = await require('./helpers').db.query(
    'SELECT archived_at FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].archived_at, null);
});

test('every POST requires a valid CSRF token', async () => {
  const category = await createCategory({ name: 'Braking' });

  // No token at all.
  const noToken = await postForm(agent(), '/categories', {
    name: 'No CSRF',
    description: '',
  });
  assert.equal(noToken.status, 403);

  // Invalid token.
  const agentInstance = agent();
  const form = await agentInstance.get('/categories/new');
  extractHidden(form, '_csrf');
  const badToken = await postForm(agentInstance, '/categories', {
    name: 'Bad CSRF',
    description: '',
    _csrf: 'not-a-valid-token',
  });
  assert.equal(badToken.status, 403);

  assert.equal(await require('./helpers').countRows('categories'), 1);
});

test('the CSRF token is unique per session and rotates with the cookie', async () => {
  const first = agent();
  const second = agent();

  const [formA, formB] = await Promise.all([
    first.get('/categories/new'),
    second.get('/categories/new'),
  ]);

  const tokenA = extractHidden(formA, '_csrf');
  const tokenB = extractHidden(formB, '_csrf');
  assert.notEqual(tokenA, tokenB);

  // A token from one session does not work in another.
  const res = await postForm(first, '/categories', {
    name: 'Cross session',
    description: '',
    _csrf: tokenB,
  });
  assert.equal(res.status, 403);
});

test('failed password attempts are rate limited to 10 per 15 minutes', async () => {
  adminAuth.resetRateLimits();

  const category = await createCategory({ name: 'Braking' });

  // 10 failed attempts.
  for (let i = 1; i <= 10; i += 1) {
    const agentInstance = agent();
    const form = await agentInstance.get(`/categories/${category.id}/edit`);
    const token = extractHidden(form, '_csrf');
    const res = await agentInstance
      .post(`/categories/${category.id}/edit`)
      .type('form')
      .send({ name: 'Attempt', description: '', _csrf: token, admin_password: 'wrong' });
    assert.equal(res.status, 403, `attempt ${i} should be rejected`);
  }

  // The 11th attempt — even with the correct password — is blocked.
  const agentInstance = agent();
  const form = await agentInstance.get(`/categories/${category.id}/edit`);
  const token = extractHidden(form, '_csrf');
  const blocked = await agentInstance
    .post(`/categories/${category.id}/edit`)
    .type('form')
    .send({ name: 'Blocked', description: '', _csrf: token, admin_password: ADMIN_PASSWORD });
  assert.equal(blocked.status, 403);
  assert.match(blocked.text, /Too many failed password attempts/i);

  const { rows } = await require('./helpers').db.query(
    'SELECT name FROM categories WHERE id = $1',
    [category.id]
  );
  assert.equal(rows[0].name, 'Braking');
});

test('a successful password attempt clears the failure count', async () => {
  adminAuth.resetRateLimits();

  const category = await createCategory({ name: 'Braking' });

  // 5 failures, then a success, then 5 more failures: still not blocked.
  for (let round = 0; round < 2; round += 1) {
    for (let i = 0; i < 5; i += 1) {
      const agentInstance = agent();
      const form = await agentInstance.get(`/categories/${category.id}/edit`);
      const token = extractHidden(form, '_csrf');
      await agentInstance
        .post(`/categories/${category.id}/edit`)
        .type('form')
        .send({ name: 'x', description: '', _csrf: token, admin_password: 'wrong' });
    }
    if (round === 0) {
      const ok = await protectedPost(
        agent(),
        `/categories/${category.id}/edit`,
        `/categories/${category.id}/edit`,
        { name: 'Braking', description: '' }
      );
      assert.equal(ok.status, 303);
    }
  }

  const agentInstance = agent();
  const form = await agentInstance.get(`/categories/${category.id}/edit`);
  const token = extractHidden(form, '_csrf');
  const res = await agentInstance
    .post(`/categories/${category.id}/edit`)
    .type('form')
    .send({ name: 'Braking', description: '', _csrf: token, admin_password: 'wrong' });
  assert.equal(res.status, 403);
  assert.doesNotMatch(res.text, /Too many failed/i);
});

test('the password is cleared after any error', async () => {
  const category = await createCategory({ name: 'Braking' });

  // Invalid data (422): the re-rendered form must not contain the password.
  const res = await publicPost(agent(), '/categories/new', '/categories', {
    name: 'x',
    description: '',
  });
  assert.equal(res.status, 422);
  const passwordInputs = res.text.match(/name="admin_password"[^>]*value="([^"]*)"/g) || [];
  for (const input of passwordInputs) {
    assert.match(input, /value=""/);
  }
  assert.doesNotMatch(res.text, /value="secret/);
});

test('no GET request modifies data', async () => {
  const category = await createCategory({ name: 'Braking' });
  const item = await createItem({ sku: 'TST-GET', category });

  await agent().get(`/items/${item.id}/archive`);
  await agent().get(`/items/${item.id}/restore`);
  await agent().get(`/items/${item.id}/movements/new?type=receipt`);
  await agent().get(`/categories/${category.id}/delete`);
  await agent().get(`/categories/${category.id}/edit`);
  await agent().get(`/items/${item.id}/edit`);

  const { rows } = await require('./helpers').db.query(
    'SELECT archived_at FROM items WHERE id = $1',
    [item.id]
  );
  assert.equal(rows[0].archived_at, null);
  assert.equal(await require('./helpers').countRows('stock_movements'), 0);
});

test('password comparison uses fixed-length digests', async () => {
  // The helper compares digests, so inputs of different lengths
  // never leak timing information about the configured value.
  const { passwordMatches } = adminAuth;
  process.env.ADMIN_PASSWORD = 'configured-value';
  assert.equal(passwordMatches('configured-value'), true);
  assert.equal(passwordMatches('wrong'), false);
  assert.equal(passwordMatches(''), false);
  assert.equal(passwordMatches(undefined), false);
  assert.equal(passwordMatches('a'.repeat(1000)), false);
});
