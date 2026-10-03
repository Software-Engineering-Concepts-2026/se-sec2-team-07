import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('Issue #8: select AI knowledge level, preserve edited drafts on failure and save mixed levels', async ({ page }) => {
  const email = `issue8-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const requests = [];
  const source = 'Stack: LIFO\nQueue: FIFO\nStack removes the most recently added item; Queue removes the earliest item.';
  try {
    const registered = await page.request.post('/api/register', { data: { name: 'Issue 8', email, password: 'TestPassword123' } });
    expect(registered.ok()).toBeTruthy();
    // AI availability/output are simulated; registration, saving and reopening use the real API/database.
    await page.route('**/api/me', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, json: { ...await response.json(), ai: true } });
    });
    await page.route('**/api/generate', async route => {
      requests.push(route.request().postDataJSON());
      if (requests.length === 2) {
        await route.fulfill({ status: 502, json: { error: 'AI ไม่พร้อมใช้งาน กรุณาลองใหม่' } });
        return;
      }
      await route.fulfill({ json: { cards: requests.length === 1
        ? [{ front: 'Stack uses which order?', back: 'LIFO' }]
        : [{ front: 'Which structure returns the earliest item, and why?', back: 'Queue, because it uses FIFO.' }]
      } });
    });
    await page.goto('/');
    await page.getByRole('link', { name: 'สร้างชุดการ์ด', exact: true }).click();
    const level = page.getByLabel('ระดับความรู้', { exact: true });
    const mode = page.getByLabel('วิธีสร้าง');
    const sourceInput = page.getByLabel('หรือวางข้อความจากโน้ต');
    const generate = page.getByRole('button', { name: /สร้างการ์ดจากเนื้อหา/ });
    const questions = page.getByRole('textbox', { name: 'ด้านหน้า · คำถาม', exact: true });
    const answers = page.getByRole('textbox', { name: 'ด้านหลัง · คำตอบ', exact: true });
    await expect(mode).toHaveValue('local');
    await expect(level).toHaveCount(0);
    await page.getByLabel('ชื่อชุดการ์ด').fill('Issue 8 levels');
    await sourceInput.fill(source);
    await mode.selectOption('ai');
    await expect(level).toHaveValue('intermediate');
    await level.selectOption('beginner');
    await generate.click();
    await expect(questions).toHaveCount(1);
    expect(requests[0]).toMatchObject({ mode: 'ai', level: 'beginner', text: source });
    await questions.nth(0).fill('What does LIFO mean?');
    await answers.nth(0).fill('Last in, first out.');

    await level.selectOption('advanced');
    await expect(questions.nth(0)).toHaveValue('What does LIFO mean?');
    await generate.click();
    await expect(page.getByRole('alert')).toContainText('AI ไม่พร้อมใช้งาน');
    expect(requests[1]).toMatchObject({ mode: 'ai', level: 'advanced', text: source });
    await expect(level).toHaveValue('advanced');
    await expect(sourceInput).toHaveValue(source);
    await expect(questions).toHaveCount(1);
    await expect(questions.nth(0)).toHaveValue('What does LIFO mean?');
    await expect(answers.nth(0)).toHaveValue('Last in, first out.');
    await generate.click();
    await expect(questions).toHaveCount(2);
    expect(requests[2]).toMatchObject({ mode: 'ai', level: 'advanced', text: source });
    await expect(questions.nth(0)).toHaveValue('What does LIFO mean?');
    await expect(answers.nth(0)).toHaveValue('Last in, first out.');
    await expect(questions.nth(1)).toHaveValue('Which structure returns the earliest item, and why?');
    await mode.selectOption('local');
    await expect(level).toHaveCount(0);
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await page.getByRole('link', { name: 'Issue 8 levels', exact: true }).click();
    await page.reload();
    await expect(questions).toHaveCount(2);
    await expect(questions.nth(0)).toHaveValue('What does LIFO mean?');
    await expect(answers.nth(0)).toHaveValue('Last in, first out.');
    await expect(questions.nth(1)).toHaveValue('Which structure returns the earliest item, and why?');
    await expect(answers.nth(1)).toHaveValue('Queue, because it uses FIFO.');
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
