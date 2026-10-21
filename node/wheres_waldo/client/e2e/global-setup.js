import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { DATABASE_URL } from '../playwright.config.js';
import { CHARACTER_HITBOXES } from './helpers.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// A clean database for every run: create it if missing, migrate, seed, then replace the seed's placeholder
// hitboxes with the known rectangles the tests click on, and drop whatever earlier runs left behind.
export default async function globalSetup() {
  execFileSync('node', ['api/scripts/test-db.js'], { cwd: root, stdio: 'inherit', env: { ...process.env, TEST_DATABASE_URL: DATABASE_URL } });

  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    for (const [slug, box] of Object.entries(CHARACTER_HITBOXES)) {
      await client.query(
        `UPDATE "MapCharacter" mc SET x = $2, y = $3, width = $4, height = $5, calibrated = true
         FROM "Character" c WHERE mc."characterId" = c.id AND c.slug = $1`,
        [slug, box.x, box.y, box.width, box.height],
      );
    }
    await client.query('DELETE FROM "Game"');
    await client.query('DELETE FROM "User"');
    await client.query('DELETE FROM "session"');
  } finally {
    await client.end();
  }
}
