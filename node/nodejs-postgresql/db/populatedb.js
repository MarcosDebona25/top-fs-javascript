#! /usr/bin/env node

require("dotenv").config();
const { Client } = require("pg");

const SQL = `
CREATE TABLE IF NOT EXISTS usernames (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username VARCHAR ( 255 )
);

INSERT INTO usernames (username) 
VALUES
  ('Bryan'),
  ('Odin'),
  ('Damon');
`;

async function main() {
  console.log("seeding...");
  // Allow `node db/populatedb.js <connection-string>` to override the env var,
  // matching the pattern used in the official guide.
  const connectionString =
    process.argv[2] || process.env.DATABASE_URL;

  const client = connectionString
    ? new Client({ connectionString })
    : new Client({
        host: process.env.DB_HOST || process.env.PGHOST || "localhost",
        user: process.env.DB_USER || process.env.PGUSER,
        database: process.env.DB_NAME || process.env.PGDATABASE,
        password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
        port: process.env.DB_PORT || process.env.PGPORT || 5432,
      });
  await client.connect();
  await client.query(SQL);
  await client.end();
  console.log("done");
}

main();