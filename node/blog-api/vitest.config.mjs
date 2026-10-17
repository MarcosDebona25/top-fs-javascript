import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// One runner for the browser code of every workspace (shared, reader, author).
// The API has its own tests with node:test (npm test -w api).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['{shared,reader,author}/src/**/*.test.{js,jsx}'],
    setupFiles: ['./test/setup.js'],
    env: { VITE_API_URL: 'http://api.test/api', VITE_READER_URL: 'http://reader.test' },
    restoreMocks: true,
    unstubGlobals: true,
  },
});
