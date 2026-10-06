import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

test('Issue #6: set daily workload, review a bounded queue, and see the updated schedule', async ({
  page,
}, testInfo) => {
  const email = `issue6-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    expect(
      (
        await page.request.post('/api/register', {
          data: { name: 'Planner', email, password: 'TestPassword123' },
        })
      ).ok(),
    ).toBeTruthy();
    const created = await page.request.post('/api/decks', {
      data: {
        name: 'Study plan',
        cards: Array.from({ length: 5 }, (_, i) => ({
          front: `Plan question ${i}`,
          back: `Answer ${i}`,
        })),
      },
    });
    const deck = await (await page.request.get(`/api/decks/${(await created.json()).id}`)).json();
    await page.goto('/#/schedule');
    await expect(page.getByRole('heading', { name: 'ตารางทบทวน', exact: true })).toBeVisible();
    await page.getByLabel('เวลาทบทวนต่อวัน (นาที)').fill('1');
    await page.getByRole('button', { name: 'บันทึกเวลาและปรับตาราง' }).click();
    await expect(page.locator('.schedule-today-metrics > div').first()).toContainText('พร้อมทบทวน');
    await expect(page.locator('.schedule-today-metrics > div').first().locator('dd')).toHaveText(
      '2 ใบ',
    );
    await expect(page.locator('.schedule-today-metrics > div').first()).toContainText(
      'ถึงกำหนดทั้งหมด 5 ใบ',
    );
    await page.reload();
    await expect(page.getByLabel('เวลาทบทวนต่อวัน (นาที)')).toHaveValue('1');
    await page.getByLabel('เวลาทบทวนต่อวัน (นาที)').fill('2');
    await page.getByRole('button', { name: 'บันทึกเวลาและปรับตาราง' }).click();
    await expect(page.locator('.schedule-today-metrics > div').first()).toContainText('พร้อมทบทวน');
    await expect(page.locator('.schedule-today-metrics > div').first().locator('dd')).toHaveText(
      '4 ใบ',
    );
    await expect(page.locator('.schedule-today-metrics > div').first()).toContainText(
      'ถึงกำหนดทั้งหมด 5 ใบ',
    );
    await page.getByLabel('เวลาทบทวนต่อวัน (นาที)').fill('1');
    await page.getByRole('button', { name: 'บันทึกเวลาและปรับตาราง' }).click();
    await page.getByRole('link', { name: 'เริ่มตามแผนวันนี้' }).click();
    await expect(page.getByText('การ์ด 1 จาก 2 ใบ')).toBeVisible();
    await expect(page.getByLabel('เวลาที่เหลือ')).toHaveText(/^(01:00|00:\d\d)$/);
    await page.locator('.review-card').click();
    await page.getByRole('button', { name: /3 · จำได้/ }).click();
    await expect(page.getByText('การ์ด 2 จาก 2 ใบ')).toBeVisible();
    await page.getByRole('button', { name: 'จบรอบนี้' }).click();
    await page.getByRole('link', { name: 'ดูตารางทบทวน' }).click();
    const plan = await (await page.request.get('/api/review/plan')).json();
    expect(
      plan.days
        .slice(1)
        .flatMap((day) => day.cards)
        .some((card) => card.id === deck.cards[0].id),
    ).toBeTruthy();
    expect(plan.remaining_seconds).toBeLessThan(60);
    await page.screenshot({ path: `.local/${testInfo.project.name}-schedule.png`, fullPage: true });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    // Consume the rest in another session; opening this page must not reset the daily budget.
    expect(
      (
        await page.request.post('/api/review', {
          data: { id: randomUUID(), card_id: deck.cards[1].id, rating: 'hard', seconds: 60 },
        })
      ).ok(),
    ).toBeTruthy();
    await page.goto('/#/review');
    await expect(page.getByRole('heading', { name: 'พักก่อน แล้วค่อยทบทวนต่อ' })).toBeVisible();
    await page.getByRole('link', { name: 'ดูตารางทบทวน' }).click();
    await expect(page.locator('.schedule-today-metrics > div').first()).toContainText('พร้อมทบทวน');
    await expect(page.locator('.schedule-today-metrics > div').first().locator('dd')).toHaveText(
      '0 ใบ',
    );
    await expect(page.locator('.schedule-today-metrics > div').first()).toContainText(
      'ถึงกำหนดทั้งหมด 3 ใบ',
    );
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});

test('Issue #6: stop when the configured session time expires without answering automatically', async ({
  page,
}) => {
  const email = `issue6-timer-${randomUUID()}@example.com`;
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try {
    expect(
      (
        await page.request.post('/api/register', {
          data: { name: 'Timer', email, password: 'TestPassword123' },
        })
      ).ok(),
    ).toBeTruthy();
    await page.request.post('/api/decks', {
      data: { name: 'Timer deck', cards: [{ front: 'Question', back: 'Answer' }] },
    });
    await page.request.put('/api/review/plan', { data: { minutes: 1 } });
    await page.goto('/#/review');
    await expect(page.getByText('การ์ด 1 จาก 1 ใบ')).toBeVisible();
    await page.clock.install();
    await page.clock.fastForward(61000);
    await expect(page.getByRole('heading', { name: 'วันนี้คุณก้าวไปอีกขั้นแล้ว' })).toBeVisible();
    await expect(page.locator('.review-card')).toHaveCount(0);
    expect((await (await page.request.get('/api/stats')).json()).total).toBe(0);
  } finally {
    await pool.query('DELETE FROM users WHERE email=$1', [email]);
    await pool.end();
  }
});
