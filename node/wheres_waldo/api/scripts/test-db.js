// Prepares the test database: creates it if missing, applies the migrations and runs the seed.
// The API tests and the end-to-end suite both run against it, never against the dev database.
const path = require('node:path');
const { execFileSync } = require('node:child_process');
// Also required from the Playwright config, which runs from the monorepo root.
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });
const { Client } = require('pg');

function testDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `${url.pathname}_test`;
  return url.toString();
}

async function createIfMissing(databaseUrl) {
  const url = new URL(databaseUrl);
  const name = url.pathname.slice(1);
  url.pathname = '/postgres';
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  try {
    const { rowCount } = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    // Identifiers cannot be bound as parameters; the name comes from our own .env.
    if (rowCount === 0) await client.query(`CREATE DATABASE "${name.replace(/"/g, '""')}"`);
  } finally {
    await client.end();
  }
}

async function main() {
  const databaseUrl = testDatabaseUrl();
  await createIfMissing(databaseUrl);
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  const options = { cwd: path.join(__dirname, '..'), env, stdio: 'inherit' };
  execFileSync('npx', ['prisma', 'migrate', 'deploy'], options);
  execFileSync('node', ['prisma/seed.js'], options);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { testDatabaseUrl };
