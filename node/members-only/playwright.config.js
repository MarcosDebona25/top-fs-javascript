'use strict';

const { defineConfig } = require('@playwright/test');

const PORT = 3100;

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  globalSetup: './e2e/global-setup.js',
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  // Runs the real server against the throwaway test database.
  webServer: {
    command: 'node server.js',
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    env: {
      NODE_ENV: 'test',
      PORT: String(PORT),
      MEMBER_PASSCODE: 'member-pass',
      ADMIN_PASSCODE: 'admin-pass',
      SESSION_SECRET: 'e2e-secret',
    },
  },
});
