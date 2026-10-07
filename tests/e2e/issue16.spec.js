import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { navigateTo } from './helpers/navigation.js';

const first = 'Stack ที่เรียนจบแล้ว';
const second = 'Queue ที่ยังต้องทบทวน';

async function fixture(page, run) {
  const email = `archive-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    expect(
      (
        await page.request.post('/api/register', {
          data: { name: 'Archive learner', email, password: 'TestPassword123' },
        })
      ).ok(),
    ).toBeTruthy();
    const created = await page.request.post('/api/decks', {
      data: {
        name: 'โครงสร้างข้อมูลสำหรับจัดเก็บ',
        cards: [
          { front: first, back: 'เข้าหลัง ออกก่อน' },
          { front: second, back: 'เข้าก่อน ออกก่อน' },
        ],
      },
    });
    expect(created.ok()).toBeTruthy();
    const deckId = (await created.json()).id;
    const detail = await (await page.request.get(`/api/decks/${deckId}`)).json();
    const card = detail.cards.find((item) => item.front === first);
    const courseResponse = await page.request.post('/api/courses', {
      data: { name: 'วิชาที่ใช้การ์ดร่วมกัน' },
    });
    expect(courseResponse.ok()).toBeTruthy();
    const courseId = (await courseResponse.json()).id;
    expect(
      (await page.request.put(`/api/courses/${courseId}/cards/${card.id}`, { data: {} })).ok(),
    ).toBeTruthy();
    const userId = (await pool.query('SELECT id FROM users WHERE email=$1', [email])).rows[0].id;
    const reviewId = randomUUID();
    await pool.query(
      'INSERT INTO reviews(id,user_id,card_id,rating,seconds,created) VALUES($1,$2,$3,$4,$5,$6)',
      [reviewId, userId, card.id, 'good', 10, Date.now() / 1000],
    );
    await page.goto('/');
    await expect(page.locator('.dashboard-hero')).toBeVisible();
    await navigateTo(page, '#/archive');
    await expect(page.getByRole('heading', { name: 'จัดเก็บการ์ด', exact: true })).toBeVisible();
    await run({ deckId, card, courseId, pool, reviewId });
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
}

const cardArticle = (page) => page.getByRole('article').filter({ hasText: first });

test('Issue #16: archive and restore a shared card without losing identity, links or review history', async ({
  page,
}, testInfo) => {
  await fixture(page, async ({ deckId, card, courseId, pool, reviewId }) => {
    await cardArticle(page)
      .getByRole('button', { name: 'เรียนจบแล้ว · จัดเก็บ', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    await expect(cardArticle(page)).toBeVisible();
    await cardArticle(page)
      .getByRole('button', { name: 'เรียนจบแล้ว · จัดเก็บ', exact: true })
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(cardArticle(page)).toHaveCount(0);
    await expect(page.getByRole('article').filter({ hasText: second })).toBeVisible();
    for (const suffix of ['', `?deck=${deckId}`, `?course=${courseId}`]) {
      const response = await page.request.get(`/api/review${suffix}`);
      expect(response.ok()).toBeTruthy();
      const plan = await response.json();
      expect(plan.cards.map((item) => item.id)).not.toContain(card.id);
    }
    await page.goto(`/#/review?course=${courseId}`);
    await expect(
      page.getByRole('heading', { name: 'ทบทวนครบสำหรับตอนนี้แล้ว', exact: true }),
    ).toBeVisible();
    await page.goto('/#/archive');
    await page.getByRole('button', { name: 'เรียนจบแล้ว', exact: true }).click();
    await expect(cardArticle(page)).toBeVisible();
    await page.reload();
    await page.getByRole('button', { name: 'เรียนจบแล้ว', exact: true }).click();
    await expect(cardArticle(page)).toContainText('เข้าหลัง ออกก่อน');
    await expect(cardArticle(page)).toContainText('โครงสร้างข้อมูลสำหรับจัดเก็บ');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    await page.screenshot({ path: `.local/${testInfo.project.name}-archive.png`, fullPage: true });
    const archivedDetail = await (await page.request.get(`/api/decks/${deckId}`)).json();
    expect(
      archivedDetail.cards.find((item) => item.id === card.id).courses.map((item) => item.id),
    ).toContain(courseId);
    expect(
      (await pool.query('SELECT card_id,rating FROM reviews WHERE id=$1', [reviewId])).rows,
    ).toEqual([{ card_id: card.id, rating: 'good' }]);
    await cardArticle(page).getByRole('button', { name: 'นำกลับมาทบทวน', exact: true }).click();
    await expect(cardArticle(page)).toHaveCount(0);
    await page.getByRole('button', { name: 'ยังทบทวนอยู่', exact: true }).click();
    await expect(cardArticle(page)).toBeVisible();
    const restored = await (await page.request.get(`/api/review?course=${courseId}`)).json();
    expect(restored.cards.map((item) => item.id)).toEqual([card.id]);
    await page.goto(`/#/review?course=${courseId}`);
    await expect(page.getByRole('button', { name: new RegExp(first) })).toBeVisible();
  });
});

test('Issue #16: failed archive keeps the card available and permits a successful retry', async ({
  page,
}) => {
  await fixture(page, async ({ card }) => {
    let attempts = 0;
    await page.route(`**/api/cards/${card.id}/archive`, async (route) => {
      attempts += 1;
      expect(route.request().postDataJSON()).toEqual({ archived: true });
      if (attempts === 1)
        return route.fulfill({ status: 503, json: { error: 'จัดเก็บไม่สำเร็จชั่วคราว' } });
      await route.continue();
    });
    await cardArticle(page)
      .getByRole('button', { name: 'เรียนจบแล้ว · จัดเก็บ', exact: true })
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('จัดเก็บไม่สำเร็จชั่วคราว');
    await expect(cardArticle(page)).toBeVisible();
    await cardArticle(page)
      .getByRole('button', { name: 'เรียนจบแล้ว · จัดเก็บ', exact: true })
      .click();
    await page.getByRole('dialog').getByRole('button', { name: 'ยืนยัน', exact: true }).click();
    await expect(cardArticle(page)).toHaveCount(0);
    expect(attempts).toBe(2);
    await page.getByRole('button', { name: 'เรียนจบแล้ว', exact: true }).click();
    await expect(cardArticle(page)).toBeVisible();
  });
});
