import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('Issue #9: pause, resume, reset, break review, navigation and session reset', async ({ page }) => {
  const email = `issue9-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    expect((await page.request.post('/api/register', { data: { name: 'Pomodoro', email, password: 'TestPassword123' } })).ok()).toBeTruthy();
    expect((await page.request.post('/api/decks', { data: { name: 'Break deck', cards: [{ front: 'Break question', back: 'Break answer' }] } })).ok()).toBeTruthy();
    await page.clock.install();
    await page.goto('/#/pomodoro');
    const timer = page.getByRole('timer');
    await expect(timer).toHaveText('25:00');
    await page.getByRole('button', { name: 'เริ่มจับเวลา', exact: true }).click();
    await page.clock.fastForward(60000);
    await expect(timer).toHaveText('24:00');
    await page.getByRole('button', { name: 'หยุดชั่วคราว', exact: true }).click();
    await page.clock.fastForward(60000);
    await expect(timer).toHaveText('24:00');
    await page.getByRole('button', { name: 'เริ่มต่อ', exact: true }).click();
    await page.clock.fastForward(60000);
    await expect(timer).toHaveText('23:00');
    await page.getByRole('button', { name: 'รีเซ็ตช่วงนี้' }).click();
    await expect(timer).toHaveText('25:00');
    await page.clock.fastForward(60000);
    await expect(timer).toHaveText('25:00');
    await page.getByRole('button', { name: 'เริ่มจับเวลา', exact: true }).click();
    await page.getByRole('link', { name: 'ภาพรวม', exact: true }).click();
    await page.clock.fastForward(25 * 60000);
    const banner = page.getByRole('complementary', { name: 'สถานะ Pomodoro' });
    await expect(banner).toContainText('ครบช่วงเรียนแล้ว');
    await expect(banner).toContainText('05:00');
    await page.clock.fastForward(60000);
    await expect(banner).toContainText('05:00');
    await banner.getByRole('link', { name: /ทบทวน Flashcards/ }).click();
    await expect(page).toHaveURL(/#\/review$/);
    await expect(page.getByText('Break question', { exact: true })).toBeVisible();
    expect((await page.request.get('/api/me')).ok()).toBeTruthy();
    const before = await (await page.request.get('/api/review/plan')).json();
    await page.getByRole('navigation').getByRole('link', { name: 'Pomodoro', exact: true }).click();
    await page.getByRole('button', { name: 'เริ่มจับเวลา', exact: true }).click();
    await page.getByRole('link', { name: 'ทบทวน Flashcards ช่วงพัก', exact: true }).click();
    await page.clock.fastForward(5 * 60000);
    await expect(banner).toContainText('ครบช่วงพักแล้ว');
    await expect(banner).toContainText('25:00');
    expect(await (await page.request.get('/api/review/plan')).json()).toEqual(before);
    await page.getByRole('navigation').getByRole('link', { name: 'Pomodoro', exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'เริ่มจับเวลา', exact: true }).click();
    await page.clock.fastForward(60000);
    await page.reload();
    await expect(timer).toHaveText('25:00');
    await page.locator('.topbar').getByRole('button', { name: 'ออกจากระบบ' }).click();
    await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true })).toBeVisible();
    await page.getByLabel('อีเมล', { exact: true }).fill(email);
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('TestPassword123');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await expect(timer).toHaveText('25:00');
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});

