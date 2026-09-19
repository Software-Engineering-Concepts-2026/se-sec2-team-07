import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('Issue #11: reuse cards and notes across courses without losing originals', async ({ page }, testInfo) => {
  const email = `courses-ui-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    expect((await page.request.post('/api/register', { data: { name: 'Courses test', email, password: 'TestPassword123' } })).ok()).toBeTruthy();
    const created = await page.request.post('/api/decks', { data: { name: 'Shared original', cards: [{ front: 'Stack?', back: 'LIFO' }] } });
    const deckId = (await created.json()).id;
    await page.goto('/#/notes');
    await page.getByLabel('ชื่อโน้ต', { exact: true }).fill('Shared notes');
    await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('Original text');
    await page.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Shared notes', exact: true })).toBeVisible();
    const courseIds = [];
    for (const name of ['Data Structures', 'Algorithms']) {
      await page.goto('/#/courses');
      await page.getByLabel('ชื่อรายวิชาใหม่').fill(name);
      await page.getByRole('button', { name: 'สร้างรายวิชา', exact: true }).click();
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
      courseIds.push(page.url().split('/').at(-1));
      await page.getByRole('button', { name: 'เพิ่มจากคลัง', exact: true }).click();
      const picker = page.getByRole('region', { name: 'เพิ่มจากคลัง', exact: true });
      await picker.getByRole('button', { name: 'เชื่อมกับวิชานี้', exact: true }).click();
      await expect(picker.getByRole('button', { name: 'เชื่อมแล้ว', exact: true })).toBeDisabled();
      await page.getByLabel('ประเภทเนื้อหา').selectOption('notes');
      await picker.getByRole('button', { name: 'เชื่อมกับวิชานี้', exact: true }).click();
      await expect(picker.getByRole('button', { name: 'เชื่อมแล้ว', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: 'ปิดคลัง' }).click();
    }
    await page.goto(`/#/edit/${deckId}`);
    await page.getByRole('textbox', { name: 'ด้านหน้า · คำถาม', exact: true }).fill('Updated stack?');
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด' }).click();
    await expect(page.getByRole('dialog')).toContainText('Algorithms');
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Shared original', exact: true })).toBeVisible();
    await page.goto(`/#/courses/${courseIds[0]}`);
    await expect(page.getByRole('heading', { name: 'Updated stack?', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'แก้ต้นฉบับ', exact: true }).last().click();
    await expect(page.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Original text');
    await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('Updated shared text');
    await page.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Data Structures');
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(page.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('');
    await page.goto(`/#/courses/${courseIds[1]}`);
    await expect(page.getByText('Updated shared text', { exact: true })).toBeVisible();
    await page.screenshot({ path: `.local/${testInfo.project.name}-courses.png`, fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.getByRole('button', { name: 'นำออกจากวิชา', exact: true }).first().click();
    await expect(page.getByRole('heading', { name: 'ยังไม่มีการ์ดในวิชานี้' })).toBeVisible();
    const original = await (await page.request.get(`/api/decks/${deckId}`)).json();
    expect(original.cards).toHaveLength(1);
    expect(original.cards[0].courses).toHaveLength(1);
    await page.getByRole('button', { name: 'ลบรายวิชา', exact: true }).click();
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'รายวิชาของฉัน', exact: true })).toBeVisible();
    const notes = await (await page.request.get('/api/notes')).json();
    expect(notes.notes[0].body).toBe('Updated shared text');
    expect(notes.notes[0].courses).toHaveLength(1);
    expect(errors).toEqual([]);
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
