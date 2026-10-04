import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('Issue #5: store, search, reopen and manage original documents alongside notes', async ({ page }) => {
  const email = `documents-ui-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const original = Buffer.from('บทเรียนเรื่องระบบนิเวศ\nPhotosynthesis converts light into chemical energy.\n', 'utf8');
  try {
    const registration = await page.request.post('/api/register', { data: { name: 'Documents test', email, password: 'TestPassword123' } });
    expect(registration.ok()).toBeTruthy();
    await page.goto('/#/notes');
    const documents = page.getByRole('region', { name: 'เอกสารต้นฉบับ', exact: true });
    const upload = page.getByLabel('เพิ่มเอกสารต้นฉบับ', { exact: true });
    await expect(upload).toBeEnabled();
    await upload.setInputFiles({ name: 'biology.txt', mimeType: 'text/plain', buffer: original });
    const document = documents.getByRole('article');
    await expect(document).toHaveCount(1);
    await document.getByText('เปิดอ่านข้อความ', { exact: true }).click();
    await expect(document.getByText('Photosynthesis converts light into chemical energy.', { exact: false })).toBeVisible();

    const search = page.getByRole('searchbox', { name: 'ค้นหาโน้ต', exact: true });
    await search.fill('PHOTOSYNTHESIS');
    await expect(document).toHaveCount(1);
    await search.fill('no matching content here');
    await expect(document).toHaveCount(0);
    await expect(documents.getByText('ไม่พบเอกสารที่ตรงกับคำค้นหา')).toBeVisible();
    await search.fill('');

    await document.getByRole('button', { name: 'เปลี่ยนชื่อเอกสาร', exact: true }).click();
    await document.getByLabel('ชื่อเอกสาร', { exact: true }).fill('Biology revision');
    await document.getByRole('button', { name: 'บันทึกชื่อเอกสาร', exact: true }).click();
    await expect(document.getByRole('heading', { name: 'Biology revision', exact: true })).toBeVisible();
    await page.reload();
    await expect(document.getByRole('heading', { name: 'Biology revision', exact: true })).toBeVisible();
    await expect(document.getByText('biology.txt', { exact: true })).toBeVisible();
    const downloadUrl = await document.getByRole('link', { name: 'ดาวน์โหลดต้นฉบับ', exact: true }).getAttribute('href');
    const downloaded = await page.request.get(downloadUrl);
    expect(downloaded.ok()).toBeTruthy();
    expect(await downloaded.body()).toEqual(original);

    await upload.setInputFiles({ name: 'unsupported.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('not a supported document') });
    await expect(documents.getByRole('alert')).toContainText('รองรับ PDF, PPTX, TXT และ MD เท่านั้น');
    await expect(document.getByRole('heading', { name: 'Biology revision', exact: true })).toBeVisible();
    expect((await (await page.request.get('/api/documents')).json()).documents).toHaveLength(1);

    await page.getByLabel('ชื่อโน้ต', { exact: true }).fill('Study reminders');
    await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('Photosynthesis is on the next exam.');
    await page.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    const noteHeading = page.getByRole('heading', { name: 'Study reminders', exact: true });
    await expect(noteHeading).toBeVisible();
    await search.fill('photosynthesis');
    await expect(noteHeading).toBeVisible();
    await expect(document).toHaveCount(1);
    await search.fill('next exam');
    await expect(noteHeading).toBeVisible();
    await expect(document).toHaveCount(0);
    await search.fill('');

    await document.getByRole('button', { name: 'ลบเอกสาร', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Biology revision');
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(document).toHaveCount(0);
    await expect(noteHeading).toBeVisible();
    expect((await page.request.get(downloadUrl)).status()).toBe(404);
    await page.reload();
    await expect(documents.getByText('ยังไม่มีเอกสาร เพิ่มไฟล์ต้นฉบับเพื่อเริ่มต้น')).toBeVisible();
    await expect(noteHeading).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    expect(errors).toEqual([]);
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
