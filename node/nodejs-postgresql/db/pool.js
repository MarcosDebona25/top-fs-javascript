require("dotenv").config();
const { Pool } = require("pg");

// Prefer a single connection string (e.g. DATABASE_URL="postgresql://user:password@localhost:5432/top_users").
// Falls back to individual parts so each piece of connection info stays out of source code.
const connectionString = process.env.DATABASE_URL;

module.exports =
  connectionString
    ? new Pool({ connectionString })
    : new Pool({
        host: process.env.DB_HOST || process.env.PGHOST || "localhost",
        user: process.env.DB_USER || process.env.PGUSER,
        database: process.env.DB_NAME || process.env.PGDATABASE,
        password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
        port: process.env.DB_PORT || process.env.PGPORT || 5432,
      });
