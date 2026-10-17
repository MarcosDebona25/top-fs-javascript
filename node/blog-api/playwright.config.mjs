import { createRequire } from 'node:module';
import { defineConfig, devices } from '@playwright/test';

// The suite starts its own API and frontends on other ports, against the test database,
// so it can run while the dev servers (3000, 5173, 5174) are up.
const require = createRequire(import.meta.url);
const { testDatabaseUrl } = require('./api/scripts/test-db.js');

export const API_URL = 'http://localhost:3100/api';
export const READER_URL = 'http://localhost:5183';
export const AUTHOR_URL = 'http://localhost:5184';

// Readiness checks go to IPv6 loopback: under WSL a connect to a closed IPv4 port hangs for about
// two minutes instead of being refused, and Playwright probes each port before starting its server.
const ready = (port, path = '') => `http://[::1]:${port}${path}`;

export default defineConfig({
  testDir: 'e2e',
  globalSetup: './e2e/global-setup.mjs',
  // Tests share one database; running them one at a time keeps them from stepping on each other.
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  use: {
    ...devices['Desktop Chrome'],
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'node src/app.js',
      cwd: 'api',
      url: ready(3100, '/api/health'),
      env: {
        PORT: '3100',
        DATABASE_URL: testDatabaseUrl(),
        CORS_ORIGINS: `${READER_URL},${AUTHOR_URL}`,
        AUTH_RATE_LIMIT: '1000',
      },
      reuseExistingServer: false,
    },
    {
      command: 'npx vite --host ::1 --port 5183 --strictPort',
      cwd: 'reader',
      url: ready(5183),
      env: { VITE_API_URL: API_URL },
      reuseExistingServer: false,
    },
    {
      command: 'npx vite --host ::1 --port 5184 --strictPort',
      cwd: 'author',
      url: ready(5184),
      env: { VITE_API_URL: API_URL, VITE_READER_URL: READER_URL },
      reuseExistingServer: false,
    },
  ],
});
