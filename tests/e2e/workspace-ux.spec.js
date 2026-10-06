import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('workspace navigation, password visibility and responsive pages', async ({ page }, info) => {
  const email = `ux-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/');
    const password = page.getByLabel('รหัสผ่าน', { exact: true });
    await password.fill('TestPassword123');
    await page.getByRole('button', { name: 'แสดงรหัสผ่าน', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'text');
    await page.getByRole('button', { name: 'ซ่อนรหัสผ่าน', exact: true }).click();
    await expect(password).toHaveAttribute('type', 'password');
    await page.screenshot({ path: `.local/ux-${info.project.name}-auth.png`, fullPage: true });
    expect(
      (
        await page.request.post('/api/register', {
          data: { name: 'UX review', email, password: 'TestPassword123' },
        })
      ).ok(),
    ).toBeTruthy();
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /สวัสดี/ })).toBeVisible();
    const links = page.getByRole('navigation', { name: 'เมนูหลัก' }).getByRole('link');
    await expect(links).toHaveCount(10);
    for (let i = 0; i < 10; i++) {
      await links.nth(i).click();
      await expect(page.locator('.loading')).toHaveCount(0);
      await expect(page.locator('h1')).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
      await page.screenshot({ path: `.local/ux-${info.project.name}-${i}.png`, fullPage: true });
    }
    await page
      .getByRole('navigation')
      .getByRole('link', { name: 'ชุดการ์ดของฉัน', exact: true })
      .click();
    await page.getByLabel('ค้นหาชุดการ์ด').fill('no result');
    await page.getByRole('button', { name: 'ล้างค้นหาชุดการ์ด', exact: true }).click();
    await expect(page.getByLabel('ค้นหาชุดการ์ด')).toBeFocused();
    await expect(page.getByLabel('ค้นหาชุดการ์ด')).toHaveValue('');
    await page.getByLabel('ค้นหาชุดการ์ด').fill('another search');
    await page.getByRole('button', { name: 'ล้างตัวกรอง', exact: true }).click();
    await expect(page.getByLabel('ค้นหาชุดการ์ด')).toHaveValue('');
    await page.getByRole('navigation').getByRole('link', { name: 'โน้ต', exact: true }).click();
    await page.getByRole('link', { name: 'เขียนโน้ต ↓', exact: true }).click();
    await expect(page.getByLabel('ชื่อโน้ต', { exact: true })).toBeFocused();
    await page.getByRole('link', { name: /ดูโน้ตที่บันทึก/ }).click();
    await expect(page.locator('#saved-notes')).toBeFocused();
    await page.getByRole('navigation').getByRole('link', { name: 'ภาพรวม', exact: true }).click();
    await expect(page).toHaveTitle('ภาพรวม · focus.');
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    expect(errors).toEqual([]);
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
