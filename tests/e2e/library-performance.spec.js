import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from './helpers/coverage.js';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('library loads without requesting statistics, including refresh', async ({ page }) => {
  const email = `fast-library-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  let statisticsRequests = 0;
  try {
    expect(
      (
        await page.request.post('/api/register', {
          data: { name: 'Fast library', email, password: 'TestPassword123' },
        })
      ).ok(),
    ).toBeTruthy();
    await page.route('**/api/stats', async (route) => {
      statisticsRequests++;
      await route.fulfill({ status: 503, json: { error: 'Statistics unavailable' } });
    });
    await page.goto('/#/decks');
    await expect(page.getByRole('heading', { name: 'ชุดการ์ดของฉัน', exact: true })).toBeVisible();
    const refreshed = page.waitForResponse(
      (r) => r.url().endsWith('/api/decks') && r.request().method() === 'GET',
    );
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    expect((await refreshed).ok()).toBeTruthy();
    expect(statisticsRequests).toBe(0);
    await page.getByRole('link', { name: 'สร้างชุดการ์ด', exact: true }).click();
    await expect(page.locator('.source-panel')).toBeVisible();
    await page.getByRole('button', { name: /เขียนเอง เพิ่มคำถาม/ }).click();
    await page.getByRole('button', { name: 'เพิ่มเอง', exact: true }).click();
    await expect(page.getByLabel('ชื่อชุดการ์ด')).toBeVisible();
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
