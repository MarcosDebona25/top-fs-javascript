'use strict';

const { Pool } = require('pg');

// NODE_ENV=test points at the throwaway test database.
const connectionString =
  process.env.NODE_ENV === 'test' ? process.env.TEST_DATABASE_URL : process.env.DATABASE_URL;

module.exports = new Pool({ connectionString });
