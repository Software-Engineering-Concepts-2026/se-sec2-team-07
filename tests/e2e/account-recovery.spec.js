import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('registration profile retry does not submit registration twice', async ({ page }) => {
  const email = `recover-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  let registrations = 0, failed = false;
  try {
    await page.goto('/');
    await page.getByRole('button', { name: 'สร้างบัญชีฟรี' }).click();
    await page.route('**/api/register', async route => { registrations++; await route.continue(); });
    await page.route('**/api/me', async route => {
      if (!failed) { failed = true; await route.fulfill({ status: 503, json: { error: 'เปิดข้อมูลบัญชีไม่สำเร็จ' } }); }
      else await route.continue();
    });
    await page.getByLabel('ชื่อที่อยากให้เราเรียก').fill('Recovery');
    await page.getByLabel('อีเมล', { exact: true }).fill(email);
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('TestPassword123');
    await page.getByRole('button', { name: 'สร้างบัญชี', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('เปิดข้อมูลบัญชีไม่สำเร็จ');
    await page.getByRole('button', { name: 'ลองเปิดบัญชีอีกครั้ง' }).click();
    await expect(page.getByRole('heading', { name: /สวัสดี/ })).toBeVisible();
    expect(registrations).toBe(1);
  } finally { await pool.query('DELETE FROM users WHERE email=$1', [email]); await pool.end(); }
});

test('logout cancellation and failed logout preserve note and card drafts', async ({ page }) => {
  const email = `draft-logout-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  let logoutRequests = 0;
  try {
    expect((await page.request.post('/api/register', { data: { name: 'Drafts', email, password: 'TestPassword123' } })).ok()).toBeTruthy();
    await page.goto('/#/notes');
    await page.getByLabel('ชื่อโน้ต', { exact: true }).fill('Keep this draft');
    await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('Unsaved content');
    await page.route('**/api/logout', async route => { logoutRequests++; await route.fulfill({ status: 503, json: { error: 'ลองออกจากระบบอีกครั้ง' } }); });
    await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).last().click();
    await expect(page.getByRole('dialog')).toContainText('ร่างนี้จะหายไป');
    await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    expect(logoutRequests).toBe(0);
    await expect(page.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Unsaved content');
    await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).last().click();
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(page.locator('#toast')).toContainText('ลองออกจากระบบอีกครั้ง');
    await expect(page.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Unsaved content');
    await page.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Keep this draft', exact: true })).toBeVisible();
    await page.goto('/#/create');
    await page.getByLabel('ชื่อชุดการ์ด').fill('Unsaved cards');
    await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).last().click();
    await expect(page.getByRole('dialog')).toContainText('ร่างนี้จะหายไป');
    await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    await expect(page.getByLabel('ชื่อชุดการ์ด')).toHaveValue('Unsaved cards');
    await page.unroute('**/api/logout');
    await page.getByRole('button', { name: 'ออกจากระบบ', exact: true }).last().click();
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ยินดีต้อนรับกลับมา' })).toBeVisible();
  } finally { await pool.query('DELETE FROM users WHERE email=$1', [email]); await pool.end(); }
});
