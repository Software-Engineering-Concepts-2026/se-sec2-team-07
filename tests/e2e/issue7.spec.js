import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

test('Issue #7: show unique cards, weak topics and history without reviewing future cards early', async ({ page }, testInfo) => {
  const email = `stats-ui-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    expect((await page.request.post('/api/register', { data: { name: 'Statistics test', email, password: 'TestPassword123' } })).ok()).toBeTruthy();
    const user = (await pool.query('SELECT id FROM users WHERE email=$1', [email])).rows[0];
    const now = Date.now() / 1000;
    const decks = [];
    for (const [name, ratings] of [['Weak topic', ['again', 'hard', 'good']], ['Strong topic', ['good', 'good', 'good']], ['New topic', ['again']]]) {
      const response = await page.request.post('/api/decks', { data: { name, cards: [{ front: `${name} question`, back: 'Answer' }] } });
      expect(response.ok()).toBeTruthy();
      const { id } = await response.json();
      const detail = await (await page.request.get(`/api/decks/${id}`)).json();
      const card = detail.cards[0];
      decks.push(id);
      for (const rating of ratings) {
        await pool.query('INSERT INTO reviews(id,user_id,card_id,rating,seconds,created) VALUES($1,$2,$3,$4,$5,$6)', [randomUUID(), user.id, card.id, rating, 10, now]);
      }
      await pool.query('UPDATE cards SET due=$1 WHERE id=$2', [now + 86400, card.id]);
    }

    const statsResponse = await page.request.get('/api/stats');
    expect(statsResponse.ok()).toBeTruthy();
    const stats = await statsResponse.json();
    expect(stats.total).toBe(7);
    expect(stats.uniqueCards).toBe(3);
    expect(stats.history).toHaveLength(30);
    expect(stats.topics.filter(topic => topic.recommended).map(topic => topic.name)).toEqual(['Weak topic']);

    await page.goto('/#/stats');
    await expect(page.getByRole('heading', { name: 'ทุกการทบทวนมีความหมาย' })).toBeVisible();
    const topics = page.getByRole('region', { name: 'สถิติรายชุดการ์ด' });
    await expect(topics.getByRole('article')).toHaveCount(3);
    const weak = topics.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Weak topic', exact: true }) });
    await expect(weak).toContainText('3 ครั้ง · 1 ใบไม่ซ้ำ · ความแม่นยำ 33%');
    await expect(weak).toContainText('จำไม่ได้ 1 ครั้ง · ยาก 1 ครั้ง');
    await expect(weak).toContainText('แนะนำให้ทบทวน');
    const strong = topics.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Strong topic', exact: true }) });
    await expect(strong).toContainText('ความแม่นยำ 100%');
    await expect(strong).not.toContainText('แนะนำให้ทบทวน');
    const recent = topics.getByRole('article').filter({ has: page.getByRole('heading', { name: 'New topic', exact: true }) });
    await expect(recent).toContainText('ข้อมูลยังไม่เพียงพอสำหรับคำแนะนำ');
    const history = page.getByRole('region', { name: 'ประวัติการทบทวน' });
    await expect(history.locator('tbody tr')).toHaveCount(30);
    await expect(history.locator('tbody tr').first()).toContainText('57%');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    await page.screenshot({ path: `.local/${testInfo.project.name}-statistics.png`, fullPage: true });

    await weak.getByRole('link', { name: 'ทบทวนชุดนี้ตามตาราง' }).click();
    await expect(page).toHaveURL(new RegExp(`/#/review/${decks[0]}$`));
    await expect(page.getByRole('heading', { name: 'ทบทวนครบสำหรับตอนนี้แล้ว' })).toBeVisible();
    await expect(page.getByText('Weak topic question', { exact: true })).toHaveCount(0);
    expect(errors).toEqual([]);
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
