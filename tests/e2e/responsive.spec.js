import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from './helpers/coverage.js';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

for (const width of [320, 768, 844, 1024])
  test(`responsive populated pages at ${width}px`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: width === 844 ? 390 : 850 });
    const email = `responsive-${randomUUID()}@example.com`;
    const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const check = async (route) => {
      const overflow = await page.evaluate(() => ({
        width: innerWidth,
        actual: document.documentElement.scrollWidth,
      }));
      expect.soft(overflow.actual, route).toBeLessThanOrEqual(overflow.width + 1);
      await page.screenshot({
        path: `.local/responsive-${width}-${route.replaceAll('/', '-') || 'home'}.png`,
        fullPage: true,
      });
    };
    try {
      await page.goto('/');
      await expect(page.getByLabel('รหัสผ่าน', { exact: true })).toBeVisible();
      await check('auth');
      expect(
        (
          await page.request.post('/api/register', {
            data: {
              name: 'ชื่อผู้ใช้สำหรับทดสอบหน้าจอขนาดเล็ก',
              email,
              password: 'TestPassword123',
            },
          })
        ).ok(),
      ).toBeTruthy();
      const response = await page.request.post('/api/decks', {
        data: {
          name: 'ชุดการ์ดทดสอบการแสดงผลและข้อความยาวบนหน้าจอ',
          cards: [{ front: 'LongWord'.repeat(30), back: 'คำตอบที่ต้องอ่านได้ครบและไม่ล้นจอ' }],
        },
      });
      expect(response.ok()).toBeTruthy();
      await page.reload();
      await expect(page.locator('.dashboard-hero')).toBeVisible();
      for (const route of [
        '',
        'decks',
        'archive',
        'courses',
        'notes',
        'pomodoro',
        'schedule',
        'stats',
        'export',
        'create',
        'review',
      ]) {
        await page.goto('/#/' + route);
        await expect(page.locator('h1')).toBeVisible();
        await check(route);
      }
      await page.goto('/#/pomodoro');
      await page.getByRole('button', { name: 'เริ่มจับเวลา', exact: true }).click();
      await page
        .getByRole('link', { name: 'ภาพรวม', exact: true })
        .filter({ visible: true })
        .click();
      const widget = page.getByRole('complementary', { name: 'สถานะ Pomodoro' });
      await expect(widget).toBeVisible();
      await widget.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
      await expect(widget.getByRole('button', { name: 'เริ่มต่อ', exact: true })).toBeVisible();
      await check('timer');
      if (width > 760) {
        await expect(page.locator('.sidebar')).toBeVisible();
        await page
          .locator('.sidebar')
          .getByRole('link', { name: 'ส่งออกผลงาน', exact: true })
          .click();
        await expect(page).toHaveURL(/export/);
      } else {
        await page.getByRole('button', { name: 'เพิ่มเติม', exact: true }).click();
        await expect(page.locator('#mobile-more')).toBeVisible();
        await check('menu');
      }
    } finally {
      await pool.query('DELETE FROM users WHERE email=$1', [email]);
      await pool.end();
    }
  });
