'use strict';

process.env.NODE_ENV = 'test';
require('dotenv').config();
process.env.MEMBER_PASSCODE = 'member-pass';
process.env.ADMIN_PASSCODE = 'admin-pass';
process.env.SESSION_SECRET = 'test-secret';

const { test, describe, before, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const pool = require('../../db/pool');
const createApp = require('../../app');

const app = createApp();
const PASSWORD = 'Abcdefg1';

function userBody(overrides = {}) {
  return {
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    password: PASSWORD,
    confirmPassword: PASSWORD,
    ...overrides,
  };
}

async function signUp(agent, overrides) {
  return agent.post('/sign-up').type('form').send(userBody(overrides));
}

async function logIn(agent, email = 'ada@example.com', password = PASSWORD) {
  return agent.post('/log-in').type('form').send({ email, password });
}

// Signs up + logs in and returns a ready agent.
async function loggedIn(overrides) {
  const agent = request.agent(app);
  await signUp(agent, overrides);
  await logIn(agent, (overrides && overrides.email) || 'ada@example.com');
  return agent;
}

async function post(agent, title = 'Secret title', text = 'Secret body') {
  return agent.post('/messages').type('form').send({ title, text });
}

before(async () => {
  assert.ok(process.env.TEST_DATABASE_URL, 'TEST_DATABASE_URL must be set');
});

beforeEach(async () => {
  await pool.query('TRUNCATE messages, users RESTART IDENTITY CASCADE');
});

after(async () => {
  await pool.end();
});

describe('sign-up', () => {
  test('creates a user with a bcrypt hash and no membership', async () => {
    const res = await signUp(request(app));
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/log-in');

    const { rows } = await pool.query('SELECT * FROM users');
    assert.equal(rows.length, 1);
    assert.match(rows[0].password_hash, /^\$2[aby]\$/);
    assert.notEqual(rows[0].password_hash, PASSWORD);
    assert.equal(rows[0].is_member, false);
    assert.equal(rows[0].is_admin, false);
  });

  test('rejects a weak password (no uppercase)', async () => {
    const res = await signUp(request(app), { password: 'abcdefg1', confirmPassword: 'abcdefg1' });
    assert.equal(res.status, 422);
    assert.match(res.text, /uppercase/i);
    assert.equal((await pool.query('SELECT 1 FROM users')).rowCount, 0);
  });

  test('rejects a weak password (no number)', async () => {
    const res = await signUp(request(app), { password: 'Abcdefgh', confirmPassword: 'Abcdefgh' });
    assert.equal(res.status, 422);
    assert.match(res.text, /number/i);
  });

  test('rejects mismatched confirmation', async () => {
    const res = await signUp(request(app), { confirmPassword: 'Abcdefg2' });
    assert.equal(res.status, 422);
    assert.match(res.text, /do not match/i);
  });

  test('rejects an invalid email and missing names', async () => {
    const res = await signUp(request(app), { email: 'nope', firstName: '', lastName: '' });
    assert.equal(res.status, 422);
    assert.match(res.text, /valid email/i);
    assert.match(res.text, /First name is required/);
    assert.match(res.text, /Last name is required/);
  });

  test('rejects a duplicate email (case-insensitive)', async () => {
    await signUp(request(app));
    const res = await signUp(request(app), { email: 'ADA@example.com' });
    assert.equal(res.status, 422);
    assert.match(res.text, /already registered/i);
    assert.equal((await pool.query('SELECT 1 FROM users')).rowCount, 1);
  });

  test('re-renders entered values but never the password', async () => {
    const res = await signUp(request(app), { password: 'weak', confirmPassword: 'weak', firstName: 'Grace' });
    assert.match(res.text, /value="Grace"/);
    assert.doesNotMatch(res.text, /value="weak"/);
  });

  test('escapes HTML in re-rendered values', async () => {
    const res = await signUp(request(app), { firstName: '<script>alert(1)</script>', password: 'x', confirmPassword: 'x' });
    assert.doesNotMatch(res.text, /<script>alert\(1\)<\/script>/);
  });
});

describe('email availability API', () => {
  test('reports availability', async () => {
    await signUp(request(app));
    const taken = await request(app).get('/api/email-available').query({ email: 'ada@example.com' });
    assert.deepEqual(taken.body, { valid: true, available: false });
    const free = await request(app).get('/api/email-available').query({ email: 'new@example.com' });
    assert.deepEqual(free.body, { valid: true, available: true });
    const bad = await request(app).get('/api/email-available').query({ email: 'nope' });
    assert.deepEqual(bad.body, { valid: false, available: false });
  });
});

describe('log-in / log-out', () => {
  test('logs in with correct credentials', async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const res = await logIn(agent);
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/');
    const home = await agent.get('/');
    assert.match(home.text, /Log out/);
  });

  test('rejects a wrong password with a generic message', async () => {
    const agent = request.agent(app);
    await signUp(agent);
    const res = await logIn(agent, 'ada@example.com', 'Wrongpass1');
    assert.equal(res.headers.location, '/log-in');
    const page = await agent.get('/log-in');
    assert.match(page.text, /Incorrect email or password/);
  });

  test('log-out ends the session', async () => {
    const agent = await loggedIn();
    await agent.post('/log-out');
    const res = await agent.get('/messages/new');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/log-in');
  });
});

describe('messages and visibility', () => {
  test('new-message requires login', async () => {
    const get = await request(app).get('/messages/new');
    assert.equal(get.headers.location, '/log-in');
    const postRes = await request(app).post('/messages').type('form').send({ title: 'a', text: 'b' });
    assert.equal(postRes.headers.location, '/log-in');
  });

  test('guests see text but not author or date', async () => {
    const agent = await loggedIn();
    await post(agent);
    const res = await request(app).get('/');
    assert.match(res.text, /Secret title/);
    assert.match(res.text, /Secret body/);
    assert.doesNotMatch(res.text, /Ada Lovelace/);
    assert.doesNotMatch(res.text, /<time/);
  });

  test('a logged-in non-member also does not see authors', async () => {
    const agent = await loggedIn();
    await post(agent);
    const res = await agent.get('/');
    assert.match(res.text, /Secret title/);
    assert.doesNotMatch(res.text, /<strong>Ada Lovelace/);
    assert.doesNotMatch(res.text, /<time/);
  });

  test('validates message fields', async () => {
    const agent = await loggedIn();
    const res = await post(agent, '', '');
    assert.equal(res.status, 422);
    assert.match(res.text, /Title is required/);
    assert.match(res.text, /Message is required/);
  });

  test('message text is HTML-escaped on the wall', async () => {
    const agent = await loggedIn();
    await post(agent, 'x', '<img src=x onerror=alert(1)>');
    const res = await request(app).get('/');
    assert.doesNotMatch(res.text, /<img src=x/);
  });
});

describe('join the club', () => {
  test('wrong passcode is rejected and membership is unchanged', async () => {
    const agent = await loggedIn();
    const res = await agent.post('/join-club').type('form').send({ passcode: 'nope' });
    assert.equal(res.status, 403);
    const { rows } = await pool.query('SELECT is_member FROM users');
    assert.equal(rows[0].is_member, false);
  });

  test('right passcode makes the user a member who sees authors and dates', async () => {
    const agent = await loggedIn();
    await post(agent);
    const res = await agent.post('/join-club').type('form').send({ passcode: 'member-pass' });
    assert.equal(res.status, 302);
    const home = await agent.get('/');
    assert.match(home.text, /Ada Lovelace/);
    assert.match(home.text, /<time/);
    // Members still cannot delete.
    assert.doesNotMatch(home.text, /\/delete"/);
  });

  test('requires login', async () => {
    const res = await request(app).post('/join-club').type('form').send({ passcode: 'member-pass' });
    assert.equal(res.headers.location, '/log-in');
  });
});

describe('admin', () => {
  test('wrong admin passcode is rejected', async () => {
    const agent = await loggedIn();
    const res = await agent.post('/become-admin').type('form').send({ passcode: 'member-pass' });
    assert.equal(res.status, 403);
    assert.equal((await pool.query('SELECT is_admin FROM users')).rows[0].is_admin, false);
  });

  test('admin sees delete buttons and can delete', async () => {
    const agent = await loggedIn();
    await post(agent);
    await agent.post('/become-admin').type('form').send({ passcode: 'admin-pass' });

    const home = await agent.get('/');
    assert.match(home.text, /\/messages\/1\/delete/);
    assert.match(home.text, /Ada Lovelace/);

    const del = await agent.post('/messages/1/delete');
    assert.equal(del.status, 302);
    assert.equal((await pool.query('SELECT 1 FROM messages')).rowCount, 0);
  });

  test('member (non-admin) gets 403 on delete and the message survives', async () => {
    const author = await loggedIn();
    await post(author);
    const member = await loggedIn({ email: 'grace@example.com', firstName: 'Grace', lastName: 'Hopper' });
    await member.post('/join-club').type('form').send({ passcode: 'member-pass' });

    const res = await member.post('/messages/1/delete');
    assert.equal(res.status, 403);
    assert.equal((await pool.query('SELECT 1 FROM messages')).rowCount, 1);
  });

  test('guest cannot delete', async () => {
    const author = await loggedIn();
    await post(author);
    const res = await request(app).post('/messages/1/delete');
    assert.equal(res.headers.location, '/log-in');
    assert.equal((await pool.query('SELECT 1 FROM messages')).rowCount, 1);
  });

  test('GET on the delete URL does nothing', async () => {
    const agent = await loggedIn();
    await post(agent);
    await agent.post('/become-admin').type('form').send({ passcode: 'admin-pass' });
    const res = await agent.get('/messages/1/delete');
    assert.equal(res.status, 404);
    assert.equal((await pool.query('SELECT 1 FROM messages')).rowCount, 1);
  });

  test('non-numeric id is a 404, not a crash', async () => {
    const agent = await loggedIn();
    await agent.post('/become-admin').type('form').send({ passcode: 'admin-pass' });
    const res = await agent.post('/messages/abc/delete');
    assert.equal(res.status, 404);
  });
});
