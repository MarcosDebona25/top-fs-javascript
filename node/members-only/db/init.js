'use strict';

// Applies db/schema.sql to the configured database (idempotent).
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const pool = require('./pool');

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Schema applied.');
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
