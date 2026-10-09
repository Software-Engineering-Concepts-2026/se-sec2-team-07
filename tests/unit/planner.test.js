import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planReviews, bangkokDate } from '../../src/backend/modules/reviews/planner.js';
const now = Date.parse('2026-09-17T12:00:00+07:00') / 1000;
const card = (id, due = now - 100, reviews = 0) => ({
  id,
  due,
  reviews,
  interval: 0,
  front: `Q${id}`,
  deck_name: 'Test',
});

test('daily capacity carries backlog forward without duplicating or reviewing future cards early', () => {
  const cards = [
    card(3),
    card(2),
    card(1, now - 200),
    card(4, now + 3600),
    card(5, now + 86400 * 10),
  ];
  const plan = planReviews(cards, 1, 30, null, now);
  assert.deepEqual(
    plan.cards.map((c) => c.id),
    [1],
  );
  assert.equal(plan.deferred_count, 2);
  assert.deepEqual(
    plan.days.slice(0, 3).map((d) => d.count),
    [1, 2, 1],
  );
  assert.equal(plan.beyond_week, 1);
  assert.equal(plan.next_due, now + 3600);
  assert.equal(new Set(plan.days.flatMap((d) => d.cards.map((c) => c.id))).size, 4);
  for (const day of plan.days) assert.ok(day.estimated_seconds <= day.budget_seconds);
});
test('spent budget and slower historical answers reduce the workload', () => {
  const cards = Array.from({ length: 20 }, (_, i) => card(i));
  assert.equal(planReviews(cards, 2, 0, 30, now).cards.length, 4);
  assert.equal(planReviews(cards, 2, 0, 60, now).cards.length, 2);
  assert.equal(planReviews(cards, 2, 90, 30, now).cards.length, 1);
  const exhausted = planReviews(cards, 1, 120, 30, now);
  assert.equal(exhausted.remaining_seconds, 0);
  assert.equal(exhausted.days[0].count, 0);
  assert.equal(exhausted.days[1].count, 2);
});
test('Bangkok midnight defines day boundaries and review history breaks equal due dates', () => {
  assert.equal(bangkokDate(Date.parse('2026-09-17T16:59:59Z') / 1000), '2026-09-17');
  assert.equal(bangkokDate(Date.parse('2026-09-17T17:00:00Z') / 1000), '2026-09-18');
  const plan = planReviews([card(1), card(2, now - 100, 3)], 1, 30, 30, now);
  assert.equal(plan.cards[0].id, 2);
  assert.equal(planReviews([], 1, 0, null, now).days.length, 7);
});
