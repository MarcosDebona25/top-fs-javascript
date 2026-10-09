'use strict';

// Start every e2e run from an empty test database.
module.exports = async () => {
  process.env.NODE_ENV = 'test';
  require('dotenv').config();
  const pool = require('../db/pool');
  await pool.query('TRUNCATE messages, users RESTART IDENTITY CASCADE');
  await pool.end();
};
