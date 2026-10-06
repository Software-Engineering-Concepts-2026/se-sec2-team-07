import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('Issue #4: inspect AI drafts, edit, undo deletion, retry save and reopen', async ({
  page,
}) => {
  const email = `issue4-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    const registered = await page.request.post('/api/register', {
      data: { name: 'Issue 4', email, password: 'TestPassword123' },
    });
    expect(registered.ok()).toBeTruthy();
    // Only AI availability and generated output are simulated; saves use the real API/database.
    await page.route('**/api/me', async (route) => {
      const response = await route.fetch();
      await route.fulfill({ response, json: { ...(await response.json()), ai: true } });
    });
    await page.route('**/api/generate', async (route) => {
      expect(route.request().postDataJSON().mode).toBe('ai');
      await route.fulfill({
        json: {
          cards: [
            { front: 'Stack?', back: 'Incorrect answer' },
            { front: 'Unwanted?', back: 'Remove this' },
            { front: 'Queue?', back: 'FIFO' },
          ],
        },
      });
    });
    await page.goto('/');
    await page.getByRole('link', { name: 'สร้างชุดการ์ด', exact: true }).click();
    await page.getByLabel('ชื่อชุดการ์ด').fill('Issue 4 draft');
    await page.getByLabel('หรือวางข้อความจากโน้ต').fill('Stack: LIFO\nQueue: FIFO');
    await page.getByLabel('วิธีสร้าง').selectOption('ai');
    await page.getByRole('button', { name: /สร้างการ์ดจากเนื้อหา/ }).click();
    const questions = page.getByRole('textbox', { name: 'ด้านหน้า · คำถาม', exact: true });
    const answers = page.getByRole('textbox', { name: 'ด้านหลัง · คำตอบ', exact: true });
    await expect(questions).toHaveCount(3);
    expect(
      (
        await pool.query(
          'SELECT d.id FROM decks d JOIN users u ON u.id=d.user_id WHERE u.email=$1',
          [email],
        )
      ).rowCount,
    ).toBe(0);
    await questions.nth(0).fill('What is a stack?');
    await answers.nth(0).fill('LIFO');
    await page.getByRole('button', { name: 'ลบการ์ด 2', exact: true }).click();
    await expect(questions).toHaveCount(2);
    await expect(questions.nth(1)).toHaveValue('Queue?');
    await page.getByRole('button', { name: 'คืนการ์ดที่ลบล่าสุด' }).click();
    await expect(questions.nth(1)).toHaveValue('Unwanted?');
    await expect(answers.nth(0)).toHaveValue('LIFO');
    await page.getByRole('button', { name: 'ลบการ์ด 2', exact: true }).click();
    await answers.nth(0).fill('   ');
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await expect(page.getByRole('alert')).toContainText('ใบที่ 1');
    await answers.nth(0).fill('LIFO');
    await page.route(
      '**/api/decks',
      (route) => route.fulfill({ status: 500, json: { error: 'บันทึกไม่สำเร็จ ลองใหม่' } }),
      { times: 1 },
    );
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await expect(page.getByRole('alert')).toContainText('บันทึกไม่สำเร็จ');
    await expect(questions.nth(0)).toHaveValue('What is a stack?');
    await expect(answers.nth(0)).toHaveValue('LIFO');
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await page.getByRole('link', { name: 'Issue 4 draft', exact: true }).click();
    await page.reload();
    await expect(questions).toHaveCount(2);
    await expect(questions.nth(0)).toHaveValue('What is a stack?');
    await expect(answers.nth(0)).toHaveValue('LIFO');
    await expect(questions.nth(1)).toHaveValue('Queue?');
    // Existing cards are only deleted from storage when the user saves.
    await page.getByRole('button', { name: 'ลบการ์ด 1', exact: true }).click();
    await expect(questions.nth(0)).toHaveValue('Queue?');
    expect(
      (
        await pool.query(
          'SELECT c.id FROM cards c JOIN decks d ON d.id=c.deck_id JOIN users u ON u.id=d.user_id WHERE u.email=$1',
          [email],
        )
      ).rowCount,
    ).toBe(2);
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await page.getByRole('link', { name: 'Issue 4 draft', exact: true }).click();
    await expect(questions).toHaveCount(1);
    await expect(questions.nth(0)).toHaveValue('Queue?');
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
