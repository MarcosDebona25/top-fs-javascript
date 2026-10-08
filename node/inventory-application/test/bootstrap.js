'use strict';

// Test bootstrap: runs before anything else in every test file.
// It refuses configurations that point at the development database
// and repoints the app at the test database.

require('dotenv').config();

const assert = require('node:assert');
const { URL } = require('url');

const testUrl = process.env.TEST_DATABASE_URL;
assert(
  testUrl,
  'TEST_DATABASE_URL is required. Copy .env.example to .env and fill it in.'
);

const testPath = new URL(testUrl).pathname;
assert.equal(
  testPath,
  '/axle_supply_test',
  `Tests must run against the "axle_supply_test" database, got "${testPath}".`
);

const devUrl = process.env.DATABASE_URL;
assert(
  devUrl && new URL(devUrl).pathname !== testPath,
  'DATABASE_URL and TEST_DATABASE_URL must point to different databases.'
);

// Every module loaded from now on (pool, app, services) uses the test database.
process.env.DATABASE_URL = testUrl;
