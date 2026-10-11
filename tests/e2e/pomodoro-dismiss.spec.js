import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from './helpers/coverage.js';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { navigateTo } from './helpers/navigation.js';

test('dismiss floating timer without resetting paused or running time', async ({ page }) => {
  const email = `dismiss-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await page.request.post('/api/register', {
      data: { name: 'Timer', email, password: 'TestPassword123' },
    });
    await page.clock.install();
    await page.goto('/#/pomodoro');
    await page.getByRole('button', { name: 'เริ่มจับเวลา', exact: true }).click();
    await navigateTo(page, '#/');
    const widget = page.getByRole('complementary', { name: 'สถานะ Pomodoro' });
    await widget.getByRole('button', { name: 'ซ่อนกล่อง Pomodoro' }).click();
    await expect(widget).toHaveCount(0);
    await page.clock.fastForward(60000);
    await navigateTo(page, '#/pomodoro');
    await expect(page.getByRole('timer')).toHaveText('24:00');
    await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
    await page.getByRole('button', { name: 'แสดงกล่องเวลาบนหน้าอื่น' }).click();
    await navigateTo(page, '#/');
    await expect(widget.getByRole('timer')).toHaveText('24:00');
    await widget.getByRole('button', { name: 'ซ่อนกล่อง Pomodoro' }).click();
    await page.clock.fastForward(60000);
    await navigateTo(page, '#/pomodoro');
    await expect(page.getByRole('timer')).toHaveText('24:00');
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
