import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { navigateTo } from './helpers/navigation.js';

const selectedName = 'ผลงานวิชาโครงสร้างข้อมูล';
const omittedName = 'ชุดส่วนตัวที่ไม่เลือก';
const cards = [
  { front: 'อธิบาย Stack 🧠\nบรรทัดที่สอง', back: 'เข้าหลัง ออกก่อน\nLIFO & <ตัวอย่าง>' },
  {
    front: '<script>alert("export")</script>',
    back: '<img src=x onerror="alert(1)"> คำตอบครบถ้วน',
  },
];

async function fixture(page, run) {
  const email = `issue12-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    expect(
      (
        await page.request.post('/api/register', {
          data: { name: 'ผู้เรียนทดสอบ', email, password: 'TestPassword123' },
        })
      ).ok(),
    ).toBeTruthy();
    const user = (await pool.query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
    const created = await page.request.post('/api/decks', { data: { name: selectedName, cards } });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();
    const detail = await (await page.request.get(`/api/decks/${id}`)).json();
    expect(
      (
        await page.request.post('/api/decks', {
          data: {
            name: omittedName,
            cards: [{ front: 'PRIVATE_UNSELECTED_QUESTION', back: 'PRIVATE_UNSELECTED_ANSWER' }],
          },
        })
      ).ok(),
    ).toBeTruthy();
    for (const [rating, seconds] of [
      ['again', 10],
      ['good', 20],
    ]) {
      await pool.query(
        'INSERT INTO reviews(id,user_id,card_id,rating,seconds,created) VALUES($1,$2,$3,$4,$5,$6)',
        [randomUUID(), user.id, detail.cards[0].id, rating, seconds, Date.now() / 1000],
      );
    }
    await page.goto('/');
    await expect(page.locator('.dashboard-hero')).toBeVisible();
    await navigateTo(page, '#/export');
    await expect(page.getByRole('checkbox', { name: selectedName, exact: true })).toBeVisible();
    await run({ id, email });
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
}

async function downloadFile(page, extension) {
  const pending = page.waitForEvent('download');
  await page.getByRole('button', { name: 'ส่งออกไฟล์', exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(new RegExp(`^focus-portfolio-.*\\.${extension}$`));
  expect(await download.failure()).toBeNull();
  const content = await readFile(await download.path(), 'utf8');
  await expect(page.getByText('สร้างไฟล์ส่งออกแล้ว', { exact: true })).toBeVisible();
  return content;
}

function assertPrivateDataAbsent(content, email) {
  for (const value of [
    email,
    'TestPassword123',
    omittedName,
    'PRIVATE_UNSELECTED_QUESTION',
    'PRIVATE_UNSELECTED_ANSWER',
  ])
    expect(content).not.toContain(value);
}

test('Issue #12: download selected full Unicode cards and their learning summary as JSON', async ({
  page,
}) => {
  await fixture(page, async ({ email }) => {
    await expect(page.getByRole('button', { name: 'ส่งออกไฟล์', exact: true })).toBeDisabled();
    await expect(page.getByLabel('รูปแบบไฟล์', { exact: true })).toHaveValue('html');
    await expect(
      page.getByRole('checkbox', { name: 'เนื้อหาแฟลชการ์ด', exact: true }),
    ).toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: 'สรุปการเรียนรู้', exact: true }),
    ).not.toBeChecked();
    await page.getByRole('checkbox', { name: selectedName, exact: true }).check();
    await page.getByRole('checkbox', { name: 'สรุปการเรียนรู้', exact: true }).check();
    await page.getByLabel('รูปแบบไฟล์', { exact: true }).selectOption('json');
    const content = await downloadFile(page, 'json');
    const document = JSON.parse(content);
    expect(document.learner).toBe('ผู้เรียนทดสอบ');
    expect(document.decks).toHaveLength(1);
    expect(document.decks[0].name).toBe(selectedName);
    expect(document.decks[0].cards).toEqual(cards);
    expect(document.decks[0].learning).toEqual({
      attempts: 2,
      total_cards: 2,
      reviewed_cards: 1,
      seconds: 30,
      distribution: { again: 1, hard: 0, good: 1, easy: 0 },
      accuracy: 50,
    });
    assertPrivateDataAbsent(content, email);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
  });
});

test('Issue #12: download readable HTML with escaped card text and no unselected content', async ({
  page,
}, testInfo) => {
  await fixture(page, async ({ email }) => {
    await page.getByRole('checkbox', { name: selectedName, exact: true }).check();
    const content = await downloadFile(page, 'html');
    expect(content).toContain('<meta charset="utf-8">');
    expect(content).toContain(cards[0].front);
    expect(content).toContain('เข้าหลัง ออกก่อน\nLIFO &amp; &lt;ตัวอย่าง&gt;');
    expect(content).toContain('&lt;script&gt;alert(&quot;export&quot;)&lt;/script&gt;');
    expect(content).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt; คำตอบครบถ้วน');
    expect(content).not.toMatch(/<script\b|<img\b/i);
    expect(content).not.toContain('<h3>ผลการทบทวน</h3>');
    assertPrivateDataAbsent(content, email);
    const preview = await page.context().newPage();
    try {
      await preview.setContent(content);
      await expect(preview.getByRole('heading', { name: selectedName, exact: true })).toBeVisible();
      await expect(preview.locator('article')).toHaveCount(2);
      await expect(preview.locator('article').first()).toContainText('อธิบาย Stack 🧠');
      await expect(preview.locator('article').nth(1)).toContainText(cards[1].front);
      await expect(preview.locator('script, iframe, img, link, form')).toHaveCount(0);
      expect(
        await preview.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      ).toBeTruthy();
      await preview.screenshot({
        path: `.local/export-${testInfo.project.name}.png`,
        fullPage: true,
      });
    } finally {
      await preview.close();
    }
  });
});

test('Issue #12: keep selections after a failed export and retry a learning-only download', async ({
  page,
}) => {
  await fixture(page, async ({ id, email }) => {
    const requests = [];
    await page.route('**/api/exports', async (route) => {
      requests.push(route.request().postDataJSON());
      if (requests.length === 1)
        return route.fulfill({ status: 503, json: { error: 'ระบบส่งออกไม่พร้อมใช้งาน' } });
      await route.continue();
    });
    await page.getByRole('checkbox', { name: selectedName, exact: true }).check();
    await page.getByRole('checkbox', { name: 'เนื้อหาแฟลชการ์ด', exact: true }).uncheck();
    await expect(page.getByRole('button', { name: 'ส่งออกไฟล์', exact: true })).toBeDisabled();
    await page.getByRole('checkbox', { name: 'สรุปการเรียนรู้', exact: true }).check();
    await page.getByLabel('รูปแบบไฟล์', { exact: true }).selectOption('json');
    await page.getByRole('button', { name: 'ส่งออกไฟล์', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('ระบบส่งออกไม่พร้อมใช้งาน');
    await expect(page.getByRole('checkbox', { name: selectedName, exact: true })).toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: 'เนื้อหาแฟลชการ์ด', exact: true }),
    ).not.toBeChecked();
    await expect(
      page.getByRole('checkbox', { name: 'สรุปการเรียนรู้', exact: true }),
    ).toBeChecked();
    await expect(page.getByLabel('รูปแบบไฟล์', { exact: true })).toHaveValue('json');
    const content = await downloadFile(page, 'json');
    const expected = {
      deck_ids: [id],
      include_cards: false,
      include_learning: true,
      format: 'json',
    };
    expect(requests).toEqual([expected, expected]);
    const document = JSON.parse(content);
    expect(document.decks).toHaveLength(1);
    expect(document.decks[0]).not.toHaveProperty('cards');
    expect(document.decks[0].learning).toMatchObject({
      attempts: 2,
      reviewed_cards: 1,
      seconds: 30,
      accuracy: 50,
    });
    for (const card of cards) expect(content).not.toContain(card.front);
    assertPrivateDataAbsent(content, email);
  });
});
