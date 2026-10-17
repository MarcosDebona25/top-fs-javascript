import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { contentSecurityPolicy } from '@blog/shared/vite-csp';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), contentSecurityPolicy({ apiOrigin: new URL(env.VITE_API_URL).origin })],
    // Fixed ports: the API only accepts the origins listed in CORS_ORIGINS.
    server: { port: 5174, strictPort: true },
    preview: { port: 5174, strictPort: true },
  };
});
