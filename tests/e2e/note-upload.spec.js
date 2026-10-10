import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

test('note upload shows progress, extracted text, and retryable errors', async ({ page }) => {
  const email = `upload-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    expect(
      (
        await page.request.post('/api/register', {
          data: { name: 'Reader', email, password: 'TestPassword123' },
        })
      ).ok(),
    ).toBeTruthy();
    await page.goto('/#/notes');
    const input = page.locator('#note-file');
    await expect(input).toBeEnabled();
    let releaseRefresh;
    const refreshPending = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    await page.route('**/api/notes', async (route) => {
      await refreshPending;
      await route.fulfill({ json: { notes: [] } });
    });
    const refreshRequest = page.waitForRequest('**/api/notes');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await refreshRequest;
    await expect(page.locator('#note-title')).toBeDisabled();
    await expect(input).toBeEnabled();
    let release;
    const pending = new Promise((resolve) => {
      release = resolve;
    });
    await page.route('**/api/extract', async (route) => {
      await pending;
      await route.fulfill({
        json: { text: 'ข้อความที่อ่านจากเอกสาร', requiresReview: true, ocrPages: [1] },
      });
    });
    const file = { name: 'lesson.txt', mimeType: 'text/plain', buffer: Buffer.from('lesson text') };
    await input.setInputFiles(file);
    await expect(
      page.getByRole('status').filter({ hasText: 'กำลังอ่านข้อความจาก lesson.txt' }),
    ).toBeVisible();
    await expect(input).toBeDisabled();
    releaseRefresh();
    release();
    await expect(page.locator('#note-body')).toHaveValue('ข้อความที่อ่านจากเอกสาร');
    await expect(
      page.getByRole('status').filter({ hasText: 'อ่าน lesson.txt สำเร็จ' }),
    ).toContainText('OCR');
    await page.unroute('**/api/extract');
    await page.route('**/api/extract', (route) =>
      route.fulfill({ status: 500, json: { error: 'อ่านเอกสารไม่สำเร็จ' } }),
    );
    await input.setInputFiles(file);
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(page.locator('.note-editor [role="alert"]')).toBeVisible();
    await expect(page.locator('#note-body')).toHaveValue('ข้อความที่อ่านจากเอกสาร');
    await expect(input).toBeEnabled();
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
