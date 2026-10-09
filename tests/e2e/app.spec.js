import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('register → upload → edit → review → statistics → delete → login', async ({
  page,
}, testInfo) => {
  const email = `ui-${randomUUID()}@example.com`;
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('/');
    await page.getByRole('tab', { name: 'สมัครใหม่', exact: true }).click();
    await page.getByLabel('ชื่อที่อยากให้เราเรียก').fill('นักเรียนทดสอบ');
    await page.getByLabel('อีเมล', { exact: true }).fill(email);
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('UiTestPassword123');
    await page.getByRole('button', { name: 'สร้างบัญชี', exact: true }).click();
    await expect(page.getByRole('heading', { name: /สวัสดี/ })).toBeVisible();
    await page.getByRole('link', { name: 'สร้างชุดการ์ด', exact: true }).click();
    await page.getByLabel('อัปโหลดเอกสาร').setInputFiles({
      name: 'Data Structures.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Stack: Last in first out\nQueue: First in first out', 'utf8'),
    });
    await expect(page.getByLabel('หรือวางข้อความจากโน้ต')).toHaveValue(/Stack/);
    await page.getByRole('button', { name: /สร้างการ์ดจากเนื้อหา/ }).click();
    await expect(page.getByLabel('ด้านหน้า · คำถาม')).toHaveCount(2);
    await page.getByLabel('ด้านหน้า · คำถาม').first().fill('What is a stack?');
    await page.getByLabel('ชื่อชุดการ์ด').fill('My Data Structures');
    await page.locator('summary').filter({ hasText: 'รายละเอียดเพิ่มเติม' }).click();
    await page.getByLabel('หมวดหมู่ / แท็ก').fill('Computer Science');
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await expect(page.getByRole('heading', { name: 'My Data Structures' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'My Data Structures' })).toBeVisible();
    await page.getByRole('link', { name: 'My Data Structures', exact: true }).click();
    await page.getByLabel('คำอธิบาย', { exact: true }).fill('Unsaved description');
    await page.getByRole('link', { name: 'กลับไปคลังการ์ด' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'คำอธิบาย', exact: true })).toHaveValue(
      'Unsaved description',
    );
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await page.getByRole('link', { name: 'เริ่มทบทวน →', exact: true }).click();
    await expect(page.getByText('What is a stack?', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'พักเวลา', exact: true }).click();
    await expect(page.getByText('พักสักครู่ แล้วค่อยกลับมาเรียนรู้')).toBeVisible();
    await page.getByRole('button', { name: 'เริ่มเวลาต่อ', exact: true }).click();
    await page.locator('.review-card').click();
    await expect(page.getByText('Last in first out', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: /3 · จำได้/ }).click();
    await expect(page.getByText('Queue', { exact: true })).toBeVisible();
    await page.locator('.review-card').click();
    await page.getByRole('button', { name: /4 · ง่าย/ }).click();
    await expect(page.getByRole('heading', { name: 'วันนี้คุณก้าวไปอีกขั้นแล้ว' })).toBeVisible();
    await page.getByRole('link', { name: 'ดูความก้าวหน้า' }).click();
    await expect(
      page
        .locator('.metric')
        .filter({ hasText: 'ความจำแม่นยำ' })
        .getByText('100%', { exact: true }),
    ).toBeVisible();
    await expect(
      page
        .locator('.metric')
        .filter({ hasText: 'ทบทวนทั้งหมด' })
        .getByText('2 ครั้ง', { exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'ภาพรวม', exact: true }).click();
    await expect(page.getByRole('heading', { name: /สวัสดี/ })).toBeVisible();
    await page.screenshot({
      path: `.local/${testInfo.project.name}-dashboard.png`,
      fullPage: true,
    });
    const width = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(width.content).toBeLessThanOrEqual(width.viewport);
    await page.getByRole('link', { name: 'My Data Structures', exact: true }).click();
    await expect(
      page.getByRole('textbox', { name: 'ด้านหน้า · คำถาม', exact: true }).first(),
    ).toHaveValue('What is a stack?');
    await page.getByRole('button', { name: 'ลบชุดการ์ด', exact: true }).click();
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'เริ่มจากความรู้เรื่องที่คุณสนใจ' }),
    ).toBeVisible();
    await page.locator('.topbar').getByRole('button', { name: 'ออกจากระบบ' }).click();
    await page.getByLabel('อีเมล', { exact: true }).fill(email);
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('UiTestPassword123');
    await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'ชุดการ์ดของฉัน' })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
