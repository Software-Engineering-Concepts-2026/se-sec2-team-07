import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

test('navigate 100 draft cards, add a card and jump to saving', async ({ page }) => {
  const email = `cards-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    expect(
      (
        await page.request.post('/api/register', {
          data: { name: 'Cards', email, password: 'TestPassword123' },
        })
      ).ok(),
    ).toBeTruthy();
    await page.route('**/api/generate', (route) =>
      route.fulfill({
        json: {
          cards: Array.from({ length: 100 }, (_, i) => ({
            front: `Question ${i + 1}`,
            back: `Answer ${i + 1}`,
          })),
        },
      }),
    );
    await page.goto('/');
    await page.getByRole('link', { name: 'สร้างชุดการ์ด', exact: true }).click();
    await page.getByLabel('หรือวางข้อความจากโน้ต').fill('apple: แอปเปิล');
    await page.getByRole('button', { name: /สร้างการ์ดจากเนื้อหา/ }).click();
    const front = page.getByRole('textbox', { name: 'ด้านหน้า · คำถาม', exact: true });
    await expect(front).toHaveCount(1);
    await front.fill('Edited first');
    await page.getByLabel('เลือกการ์ดที่ต้องการแก้ไข').selectOption({ index: 99 });
    await expect(front).toHaveValue('Question 100');
    await page.getByRole('button', { name: 'เพิ่มเอง', exact: true }).click();
    await expect(front).toHaveValue('');
    await expect(page.getByText('ใบที่ 101 จาก 101', { exact: true })).toBeVisible();
    await page.getByLabel('เลือกการ์ดที่ต้องการแก้ไข').selectOption({ index: 0 });
    await expect(front).toHaveValue('Edited first');
    await page.getByRole('button', { name: /ไปขั้นตอนที่ 3/ }).click();
    await expect(page.getByLabel('ชื่อชุดการ์ด')).toBeFocused();
    await expect(page.getByLabel('ชื่อชุดการ์ด')).toBeInViewport();
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
