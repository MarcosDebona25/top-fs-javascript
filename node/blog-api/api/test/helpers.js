// Loaded first by every test file: points the app at the test database before anything connects.
const { testDatabaseUrl } = require('../scripts/test-db');

process.env.DATABASE_URL = testDatabaseUrl();

const request = require('supertest');
const app = require('../src/app');
const prisma = require('../src/lib/prisma');

const AUTHOR_ORIGIN = 'http://localhost:5174';

// What our frontends send on every write; the CSRF guard rejects anything less.
function write(req, origin = AUTHOR_ORIGIN) {
  return req.set('Origin', origin).set('X-Requested-With', 'blog-client');
}

// Logs in and returns the session cookie ("token=...") to send on later requests.
async function logIn(username, password) {
  const res = await write(request(app).post('/api/auth/login')).send({ username, password }).expect(200);
  return res.headers['set-cookie'][0].split(';')[0];
}

const passwords = {
  author: process.env.AUTHOR_PASSWORD,
  reader: process.env.READER_PASSWORD,
};

module.exports = { request, app, prisma, write, logIn, passwords };
