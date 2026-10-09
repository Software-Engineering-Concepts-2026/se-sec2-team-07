import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:8001', channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    {
      name: 'mobile',
      use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
    },
  ],
  webServer: {
    command: 'node scripts/test-server.js',
    url: 'http://127.0.0.1:8001/api/health',
    reuseExistingServer: false,
  },
});
