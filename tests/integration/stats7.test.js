import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createPool } from '../../src/backend/db/pool.js';
import { migrate } from '../../src/backend/db/migrate.js';
import { createApp } from '../../src/backend/app.js';

if (!process.env.TEST_DATABASE_URL) throw Error('Dedicated TEST_DATABASE_URL required');
const config = { databaseUrl: process.env.TEST_DATABASE_URL, jwtSecret: 'stats-seven-test-secret-at-least-32-characters', cookieSecure: false, production: false, trustProxy: 0 };
const pool = createPool(config), app = createApp(pool, config), emails = [];
before(() => migrate(pool));
after(async () => { await pool.query('DELETE FROM users WHERE email=ANY($1::text[])', [emails]); await pool.end(); });
async function setup() {
  const agent = request.agent(app), email = `${randomUUID()}@example.com`; emails.push(email);
  assert.equal((await agent.post('/api/register').send({ name: 'Stats', email, password: 'TestPassword123' })).status, 201);
  const result = await agent.post('/api/decks').send({ name: 'Biology', cards: [{ front: 'Cell?', back: 'Life unit' }] });
  const deck = (await agent.get(`/api/decks/${result.body.id}`)).body;
  const uid = (await pool.query('SELECT id FROM users WHERE email=$1', [email])).rows[0].id;
  return { agent, deck, uid };
}
async function review(uid, card, rating) {
  await pool.query('INSERT INTO reviews(id,user_id,card_id,rating,seconds,created) VALUES($1,$2,$3,$4,10,$5)', [randomUUID(), uid, card, rating, Date.now() / 1000]);
}

test('statistics isolate review and deck owners, count repeats once, and preserve schedules', async () => {
  const own = await setup(), other = await setup();
  assert.equal((await request(app).get('/api/stats')).status, 401);
  for (const rating of ['again', 'hard', 'good']) await review(own.uid, own.deck.cards[0].id, rating);
  await review(other.uid, other.deck.cards[0].id, 'easy');
  // Even inconsistent legacy data cannot reveal a different owner's topic.
  await review(own.uid, other.deck.cards[0].id, 'again');
  await review(other.uid, own.deck.cards[0].id, 'again');
  const beforePlan = (await own.agent.get('/api/review/plan')).body;
  const result = await own.agent.get('/api/stats');
  assert.equal(result.status, 200);
  assert.equal(result.body.total, 3); assert.equal(result.body.uniqueCards, 1);
  assert.equal(result.body.todayUniqueCards, 1);
  assert.deepEqual(result.body.topics, [{ id: own.deck.id, name: 'Biology', total: 3, uniqueCards: 1, accuracy: 33, again: 1, hard: 1, recommended: true }]);
  assert.equal(result.body.history.at(-1).count, 3);
  assert.equal((await other.agent.get('/api/stats')).body.total, 1);
  assert.deepEqual((await own.agent.get('/api/review/plan')).body, beforePlan);
  assert.equal((await own.agent.get(`/api/decks/${own.deck.id}`)).body.cards[0].due, own.deck.cards[0].due);
});
