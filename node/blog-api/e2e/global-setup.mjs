import { execFileSync } from 'node:child_process';
import { request } from '@playwright/test';
import { API_URL, AUTHOR_URL } from '../playwright.config.mjs';

export const AUTH_DIR = 'e2e/.auth';

// Fresh seed data for every run, then one saved session per account the tests start from.
export default async function globalSetup() {
  execFileSync('node', ['api/scripts/test-db.js'], { stdio: 'inherit' });

  const accounts = [
    ['author1', process.env.AUTHOR_PASSWORD],
    ['reader1', process.env.READER_PASSWORD],
  ];
  for (const [username, password] of accounts) {
    const context = await request.newContext({
      extraHTTPHeaders: { Origin: AUTHOR_URL, 'X-Requested-With': 'blog-client' },
    });
    const res = await context.post(`${API_URL}/auth/login`, { data: { username, password } });
    if (!res.ok()) throw new Error(`Could not log in as ${username}: ${res.status()}`);
    await context.storageState({ path: `${AUTH_DIR}/${username}.json` });
    await context.dispose();
  }
}
