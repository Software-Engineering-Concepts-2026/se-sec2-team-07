import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

async function register(page) {
  const email = `sync-routing-${randomUUID()}@example.com`;
  expect(
    (
      await page.request.post('/api/register', {
        data: { name: 'Routing learner', email, password: 'TestPassword123' },
      })
    ).ok(),
  ).toBeTruthy();
  return email;
}
async function cleanup(email) {
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
  } finally {
    await pool.end();
  }
}

test('Issue #10: back navigation discards note B draft and saves only note A', async ({ page }) => {
  const email = await register(page);
  try {
    const ids = [];
    for (const name of ['A', 'B']) {
      const created = await page.request.post('/api/notes', {
        data: { title: `Note ${name}`, body: `Saved body ${name}` },
      });
      expect(created.ok()).toBeTruthy();
      ids.push((await created.json()).id);
    }
    await page.goto('/#/notes');
    const article = (name) =>
      page.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
    await article('Note A').getByRole('button', { name: 'แก้ไขโน้ต', exact: true }).click();
    await expect(page.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Saved body A');
    await article('Note B').getByRole('button', { name: 'แก้ไขโน้ต', exact: true }).click();
    await expect(page.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Saved body B');
    await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('Discard this B draft');
    await page.goBack();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#/notes\\?edit=${ids[0]}$`));
    await expect(page.getByLabel('ชื่อโน้ต', { exact: true })).toHaveValue('Note A');
    await expect(page.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Saved body A');
    await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('A updated after going back');
    const saved = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/notes/${ids[0]}`) && response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    expect((await saved).ok()).toBeTruthy();
    const { notes } = await (await page.request.get('/api/notes')).json();
    expect(notes).toHaveLength(2);
    expect(notes.find((note) => note.id === ids[0]).body).toBe('A updated after going back');
    expect(notes.find((note) => note.id === ids[1]).body).toBe('Saved body B');
  } finally {
    await cleanup(email);
  }
});

test('Issue #10: failed deck route change clears previous editor and retry loads correct deck', async ({
  page,
}) => {
  const email = await register(page);
  try {
    const ids = [];
    for (const name of ['A', 'B']) {
      const created = await page.request.post('/api/decks', {
        data: {
          name: `Deck ${name}`,
          cards: [{ front: `Question ${name}`, back: `Answer ${name}` }],
        },
      });
      expect(created.ok()).toBeTruthy();
      ids.push((await created.json()).id);
    }
    await page.goto(`/#/edit/${ids[0]}`);
    await expect(page.getByLabel('ชื่อชุดการ์ด', { exact: true })).toHaveValue('Deck A');
    await expect(page.getByLabel('ด้านหน้า · คำถาม', { exact: true })).toHaveValue('Question A');
    await page.route(`**/api/decks/${ids[1]}`, (route) =>
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Deck B temporarily unavailable' }),
      }),
    );
    // A hash change keeps the mounted Editor instance, unlike page.goto/reload.
    await page.evaluate((id) => {
      window.location.hash = `/edit/${id}`;
    }, ids[1]);
    await expect(
      page.getByRole('heading', { name: 'เปิดข้อมูลไม่สำเร็จ', exact: true }),
    ).toBeVisible();
    await expect(page.getByLabel('ชื่อชุดการ์ด', { exact: true })).toHaveCount(0);
    await expect(page.getByLabel('ด้านหน้า · คำถาม', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'บันทึกชุดการ์ด', exact: true })).toHaveCount(0);
    await page.unroute(`**/api/decks/${ids[1]}`);
    await page.getByRole('button', { name: 'ลองใหม่', exact: true }).click();
    await expect(page.getByLabel('ชื่อชุดการ์ด', { exact: true })).toHaveValue('Deck B');
    await expect(page.getByLabel('ด้านหน้า · คำถาม', { exact: true })).toHaveValue('Question B');
    await page.getByLabel('ชื่อชุดการ์ด', { exact: true }).fill('Deck B after retry');
    const saved = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/decks/${ids[1]}`) && response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด', exact: true }).click();
    expect((await saved).ok()).toBeTruthy();
    const first = await (await page.request.get(`/api/decks/${ids[0]}`)).json();
    const second = await (await page.request.get(`/api/decks/${ids[1]}`)).json();
    expect(first.name).toBe('Deck A');
    expect(first.cards[0].front).toBe('Question A');
    expect(second.name).toBe('Deck B after retry');
    expect(second.cards[0].front).toBe('Question B');
  } finally {
    await cleanup(email);
  }
});
