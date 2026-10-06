import test from 'node:test';
import assert from 'node:assert/strict';
import { summarize } from '../../src/backend/modules/stats/service.js';

const now = Date.parse('2026-09-21T18:00:00Z');
const row = (overrides = {}) => ({
  created: now / 1000,
  seconds: 10,
  rating: 'again',
  card_id: 1,
  deck_id: 1,
  deck_name: 'Biology',
  ...overrides,
});

test('statistics distinguish attempts from unique cards across Bangkok midnight', () => {
  const stats = summarize(
    [
      row(),
      row({ rating: 'good' }),
      row({ created: Date.parse('2026-09-21T16:59:59Z') / 1000, card_id: 2 }),
    ],
    now,
  );
  assert.equal(stats.total, 3);
  assert.equal(stats.uniqueCards, 2);
  assert.equal(stats.today, 2);
  assert.equal(stats.todayUniqueCards, 1);
  assert.deepEqual(stats.history.at(-1), {
    date: '2026-09-22',
    count: 2,
    uniqueCards: 1,
    accuracy: 50,
  });
  assert.equal(stats.history.at(-2).count, 1);
  assert.equal(stats.history.length, 30);
  assert.equal(stats.topics[0].uniqueCards, 2);
  assert.equal(stats.topics[0].recommended, true);
});

test('recommendations require three attempts and use unrounded success percentage', () => {
  const ratings = (id, good, total) =>
    Array.from({ length: total }, (_, i) =>
      row({ deck_id: id, rating: i < good ? 'good' : 'hard' }),
    );
  const stats = summarize([...ratings(1, 0, 2), ...ratings(2, 7, 10), ...ratings(3, 23, 33)], now);
  const byId = Object.fromEntries(stats.topics.map((topic) => [topic.id, topic]));
  assert.equal(byId[1].recommended, false);
  assert.equal(byId[2].recommended, false);
  assert.equal(byId[3].accuracy, 70);
  assert.equal(byId[3].recommended, true);
  assert.equal(byId[3].hard, 10);
  assert.deepEqual(
    stats.topics.map((topic) => topic.id),
    [1, 3, 2],
  );
});

test('empty and old history retain compatible summary and deterministic topic ordering', () => {
  const empty = summarize([], now);
  assert.equal(empty.accuracy, 0);
  assert.equal(empty.uniqueCards, 0);
  assert.deepEqual(empty.topics, []);
  assert.ok(
    empty.history.every((day) => day.count === 0 && day.uniqueCards === 0 && day.accuracy === null),
  );
  const old = row({ created: now / 1000 - 40 * 86400 });
  const stats = summarize(
    [
      old,
      row({ deck_id: 3 }),
      row({ deck_id: 2 }),
      row({ deck_id: 2 }),
      row({ card_id: undefined, deck_id: undefined }),
    ],
    now,
  );
  assert.deepEqual(
    stats.topics.map((topic) => topic.id),
    [2, 1, 3],
  );
  assert.equal(
    stats.history.reduce((sum, day) => sum + day.count, 0),
    4,
  );
  assert.equal(stats.uniqueCards, 1);
});
