import { createRequire } from 'node:module';
import { defineConfig, devices } from '@playwright/test';

// The suite starts its own API and its own dev client on other ports, against a database of its own, so it can
// run while the dev servers (3000, 5173) are up. The database is wiped and re-seeded at the start of every run.
const require = createRequire(import.meta.url);
const { testDatabaseUrl } = require('../api/scripts/test-db.js');

function e2eDatabaseUrl() {
  if (process.env.E2E_DATABASE_URL) return process.env.E2E_DATABASE_URL;
  // test-db.js has read api/.env by now: <DATABASE_URL>_test becomes <DATABASE_URL>_e2e.
  return testDatabaseUrl().replace(/_test$/, '_e2e').replace(/_test(\?|$)/, '_e2e$1');
}

export const DATABASE_URL = e2eDatabaseUrl();
export const API_PORT = 3100;
export const CLIENT_PORT = 5174;
// Readiness checks go to IPv6 loopback: under WSL a connect to a closed IPv4 port hangs for about two minutes
// instead of being refused, and Playwright probes each port before starting its server.
export const CLIENT_URL = `http://[::1]:${CLIENT_PORT}`;

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.js',
  // The tests share one database: one at a time keeps them from stepping on each other.
  workers: 1,
  fullyParallel: false,
  // The server times a game with the wall clock. Under WSL2 that clock is stepped back by about a second every
  // half minute, which can make a run that lasts a few seconds look like it took no time and be rejected as too fast.
  // A retry is enough: the step is not there the second time.
  retries: 2,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: CLIENT_URL,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node src/app.js',
      cwd: '../api',
      url: `http://[::1]:${API_PORT}/api/health`,
      reuseExistingServer: false,
      env: {
        PORT: String(API_PORT),
        DATABASE_URL,
        SESSION_SECRET: 'e2e-secret-'.repeat(8),
        CORS_ORIGINS: CLIENT_URL,
        COOKIE_SECURE: 'false',
        // A finished game is rejected when faster than this; the suite finds the characters in milliseconds.
        MIN_GAME_MS: '1',
        AUTH_RATE_LIMIT: '10000',
        START_RATE_LIMIT: '10000',
        GUESS_RATE_LIMIT: '10000',
      },
    },
    {
      command: `npx vite --host ::1 --port ${CLIENT_PORT} --strictPort`,
      url: CLIENT_URL,
      reuseExistingServer: false,
      env: { CLIENT_PORT: String(CLIENT_PORT), API_URL: `http://[::1]:${API_PORT}` },
    },
  ],
});
