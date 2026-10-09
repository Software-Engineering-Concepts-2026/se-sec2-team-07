import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// These tests mock every API request and do not start or migrate a database.
export default defineConfig({
  testDir: './e2e',
  testMatch: 'read-cache.spec.js',
  timeout: 30000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5175', channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
  webServer: {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175',
    reuseExistingServer: false,
  },
});
