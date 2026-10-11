import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(async () => ({
  root: 'src/frontend',
  plugins: [
    process.env.VITE_COVERAGE === 'true' &&
      (await import('./src/frontend/coverage-plugin.js')).coveragePlugin(),
    react(),
  ].filter(Boolean),
  server: { port: 5173, proxy: { '/api': 'http://127.0.0.1:8000' } },
  build: { outDir: '../../dist', emptyOutDir: true },
}));
