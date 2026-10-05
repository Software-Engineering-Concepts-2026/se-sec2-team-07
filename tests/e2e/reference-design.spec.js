import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('reference design keeps routes usable and mobile navigation accessible', async ({ page }, info) => {
  const email = `design-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await page.goto('/');
    await expect(page.getByLabel('รหัสผ่าน', { exact: true })).toBeVisible();
    const password = page.getByLabel('รหัสผ่าน', { exact: true });
    await password.fill('TestPassword123');
    await page.getByRole('button', { name: 'แสดงรหัสผ่าน', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'ซ่อนรหัสผ่าน', exact: true })).toHaveText('');
    await page.getByRole('tab', { name: 'สมัครใหม่', exact: true }).click();
    await expect(page.getByLabel('ชื่อที่อยากให้เราเรียก')).toBeVisible();
    await expect(password).toHaveAttribute('type', 'password');
    await page.getByRole('tab', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await expect(page.getByLabel('ชื่อที่อยากให้เราเรียก')).toHaveCount(0);
    await page.getByRole('tab', { name: 'เข้าสู่ระบบ', exact: true }).press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'สมัครใหม่', exact: true })).toBeFocused();
    await page.getByRole('tab', { name: 'สมัครใหม่', exact: true }).press('ArrowLeft');
    await expect(page.getByRole('tab', { name: 'เข้าสู่ระบบ', exact: true })).toHaveAttribute('aria-selected', 'true');
    await password.fill('');
    await page.screenshot({ path: `.local/ref-auth-${info.project.name}.png`, fullPage: true });
    const registered = await page.request.post('/api/register', { data: { name: 'UX review', email, password: 'TestPassword123' } });
    expect(registered.ok()).toBeTruthy();
    await page.reload();
    await expect(page.locator('.dashboard-hero')).toBeVisible();
    for (const route of ['', 'decks', 'archive', 'courses', 'notes', 'pomodoro', 'schedule', 'stats', 'export', 'create']) {
      await page.goto('/#/' + route);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('Unexpected Application Error!')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
      await page.screenshot({ path: `.local/ref-${route || 'home'}-${info.project.name}.png`, fullPage: true });
    }
    if (info.project.name === 'mobile') {
      await page.getByRole('button', { name: 'เพิ่มเติม', exact: true }).click();
      await page.getByRole('region', { name: 'เมนูเพิ่มเติม' }).getByRole('link', { name: 'รายวิชา' }).click();
      await expect(page).toHaveURL(/courses/);
      await expect(page.getByRole('region', { name: 'เมนูเพิ่มเติม' })).toHaveCount(0);
    }
    const deck = await page.request.post('/api/decks', { data: { name: 'Reference test', category: 'ทั่วไป', description: '', color: 'purple', cards: [{ front: 'Stack กับ Queue ต่างกันอย่างไร?', back: 'LIFO และ FIFO' }] } });
    expect(deck.ok()).toBeTruthy();
    await page.goto('/#/review');
    await expect(page.locator('.review-card')).toBeVisible();
    await page.screenshot({ path: `.local/ref-review-${info.project.name}.png`, fullPage: true });
    await page.locator('.review-card').click();
    await expect(page.locator('.ratings')).toBeVisible();
  } finally { await pool.query('DELETE FROM users WHERE email=$1', [email]); await pool.end(); }
});
