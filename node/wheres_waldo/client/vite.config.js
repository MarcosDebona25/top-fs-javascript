import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // The browser only talks to its own origin: Vite forwards /api (including the SSE stream) to the API,
  // so the session cookie is first-party and no CORS is involved.
  const proxy = { '/api': { target: env.API_URL || 'http://localhost:3000', changeOrigin: false } };
  const port = Number(env.CLIENT_PORT) || 5173;
  return {
    plugins: [react()],
    server: { port, strictPort: true, proxy },
    preview: { port, strictPort: true, proxy },
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{js,jsx}'],
      setupFiles: ['./test/setup.js'],
      restoreMocks: true,
      unstubGlobals: true,
    },
  };
});
