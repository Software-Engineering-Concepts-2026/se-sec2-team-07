import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('Issue #3: extract notes, preserve drafts on file and AI errors, retry and save', async ({ page }) => {
  const email = `issue3-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const source = 'Stack: LIFO\nQueue: FIFO';
  try {
    const registered = await page.request.post('/api/register', { data: { name: 'Issue 3', email, password: 'TestPassword123' } });
    expect(registered.ok()).toBeTruthy();
    // Extraction, local generation and persistence use the real API. Only AI is simulated.
    await page.route('**/api/me', async route => {
      const response = await route.fetch();
      await route.fulfill({ response, json: { ...await response.json(), ai: true } });
    });
    await page.goto('/');
    await page.getByRole('link', { name: 'สร้างชุดการ์ด', exact: true }).click();
    const upload = page.getByLabel('อัปโหลดเอกสาร');
    const notes = page.getByLabel('หรือวางข้อความจากโน้ต');
    const questions = page.getByRole('textbox', { name: 'ด้านหน้า · คำถาม', exact: true });
    const answers = page.getByRole('textbox', { name: 'ด้านหลัง · คำตอบ', exact: true });
    await upload.setInputFiles({ name: 'Issue 3 notes.txt', mimeType: 'text/plain', buffer: Buffer.from(source) });
    await expect(notes).toHaveValue(source);
    await expect(page.getByLabel('ชื่อชุดการ์ด')).toHaveValue('Issue 3 notes');
    await page.getByRole('button', { name: /สร้างการ์ดจากเนื้อหา/ }).click();
    await expect(questions).toHaveCount(2);
    await expect(questions.nth(0)).toHaveValue('Stack');
    await expect(answers.nth(0)).toHaveValue('LIFO');
    await expect(questions.nth(1)).toHaveValue('Queue');
    await expect(answers.nth(1)).toHaveValue('FIFO');

    await upload.setInputFiles({ name: 'invalid.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('invalid') });
    await expect(page.getByRole('alert')).toContainText('รูปแบบไฟล์');
    await expect(notes).toHaveValue(source);
    await expect(questions).toHaveCount(2);
    const extraction = page.waitForResponse(response => response.url().endsWith('/api/extract') && response.request().method() === 'POST');
    await upload.setInputFiles({ name: 'broken.pdf', mimeType: 'application/pdf', buffer: Buffer.from('%PDF-1.7\nnot a valid PDF') });
    expect((await extraction).ok()).toBeFalsy();
    await expect(page.getByRole('alert')).toContainText('เนื้อหาเดิมยังอยู่');
    await expect(notes).toHaveValue(source);
    await expect(questions).toHaveCount(2);
    await expect(answers.nth(0)).toHaveValue('LIFO');

    let attempts = 0;
    await page.route('**/api/generate', async route => {
      expect(route.request().postDataJSON()).toEqual({ text: source, count: 10, mode: 'ai', language: 'Thai', level: 'intermediate' });
      attempts += 1;
      if (attempts === 1) {
        await route.fulfill({ status: 502, json: { error: 'สร้างการ์ดด้วย AI ไม่สำเร็จ กรุณาลองใหม่' } });
      } else {
        await route.fulfill({ json: { cards: [{ front: 'โครงสร้างใดใช้ FIFO?', back: 'Queue' }] } });
      }
    });
    await page.getByLabel('วิธีสร้าง').selectOption('ai');
    await page.getByRole('button', { name: /สร้างการ์ดจากเนื้อหา/ }).click();
    await expect(page.getByRole('alert')).toContainText('สร้างการ์ดด้วย AI ไม่สำเร็จ');
    await expect(notes).toHaveValue(source);
    await expect(questions).toHaveCount(2);
    await page.getByRole('button', { name: /สร้างการ์ดจากเนื้อหา/ }).click();
    await expect(questions).toHaveCount(3);
    expect(attempts).toBe(2);
    await expect(questions.nth(2)).toHaveValue('โครงสร้างใดใช้ FIFO?');
    expect((await pool.query('SELECT d.id FROM decks d JOIN users u ON u.id=d.user_id WHERE u.email=$1', [email])).rowCount).toBe(0);
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await page.getByRole('link', { name: 'Issue 3 notes', exact: true }).click();
    await page.reload();
    await expect(questions).toHaveCount(3);
    await expect(questions.nth(0)).toHaveValue('Stack');
    await expect(answers.nth(0)).toHaveValue('LIFO');
    await expect(questions.nth(2)).toHaveValue('โครงสร้างใดใช้ FIFO?');
    await expect(answers.nth(2)).toHaveValue('Queue');
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
