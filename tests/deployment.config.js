import { defineConfig } from '@playwright/test';

const url = new URL(process.env.DEPLOYMENT_URL);
if (url.protocol !== 'https:' || url.username || url.password)
  throw Error('A public HTTPS DEPLOYMENT_URL is required.');

export default defineConfig({
  testDir: './deployment',
  outputDir: '../test-results/deployment',
  timeout: 60000,
  workers: 1,
  use: { baseURL: url.origin, channel: 'chrome', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 1000 } } },
    { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true } },
  ],
});
