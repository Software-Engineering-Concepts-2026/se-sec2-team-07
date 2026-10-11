import { test as base, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const directory = 'coverage/browser';
const marker = '__focus_test_coverage__:';

export const test = base.extend({
  collectCoverage: [
    async ({ context }, use) => {
      if (process.env.COLLECT_COVERAGE !== 'true') return use();
      await mkdir(directory, { recursive: true });
      const writes = [];
      const save = (coverage) => {
        if (!coverage || !Object.keys(coverage).length) return;
        writes.push(writeFile(`${directory}/${randomUUID()}.json`, JSON.stringify(coverage)));
      };
      // Capture before reload/navigation as well as at teardown, including popup pages.
      await context.addInitScript((prefix) => {
        window.addEventListener('beforeunload', () => {
          if (globalThis.__coverage__)
            console.debug(prefix + JSON.stringify(globalThis.__coverage__));
        });
      }, marker);
      context.on('page', (page) => {
        page.on('console', (message) => {
          const text = message.text();
          if (text.startsWith(marker)) save(JSON.parse(text.slice(marker.length)));
        });
      });
      try {
        await use();
      } finally {
        for (const page of context.pages()) {
          if (!page.isClosed()) save(await page.evaluate(() => globalThis.__coverage__));
        }
        await Promise.all(writes);
      }
    },
    { auto: true },
  ],
});
export { expect };
