import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createPool } from '../../src/backend/db/pool.js';
import { migrate } from '../../src/backend/db/migrate.js';
import { createApp } from '../../src/backend/app.js';
import { bangkokDate } from '../../src/backend/modules/reviews/planner.js';
if (!process.env.TEST_DATABASE_URL) throw Error('Dedicated TEST_DATABASE_URL required');
const config = { databaseUrl: process.env.TEST_DATABASE_URL, jwtSecret: 'planner-test-secret-at-least-32-characters', cookieSecure: false, production: false, trustProxy: 0 };
const pool = createPool(config), app = createApp(pool, config), emails = [];
before(() => migrate(pool));
after(async () => { await pool.query('DELETE FROM users WHERE email=ANY($1::text[])', [emails]); await pool.end(); });
async function account() {
  const agent = request.agent(app), email = `${randomUUID()}@example.com`; emails.push(email);
  const registered = await agent.post('/api/register').send({ name: 'Planner', email, password: 'TestPassword123' });
  assert.equal(registered.status, 201);
  const uid = (await agent.get('/api/me')).body.user.id;
  const created = await agent.post('/api/decks').send({ name: 'Plan deck', cards: Array.from({ length: 5 }, (_, i) => ({ front: `Question ${i}`, back: `Answer ${i}` })) });
  const deck = (await agent.get(`/api/decks/${created.body.id}`)).body;
  return { agent, uid, deck };
}
test('settings persist, are validated and isolated; daily budget applies across sessions and deck filters', async () => {
  const { agent, uid, deck } = await account(), other = await account();
  assert.equal((await request(app).get('/api/review/plan')).status, 401);
  for (const minutes of [0, 121, 1.5, '10']) assert.equal((await agent.put('/api/review/plan').send({ minutes })).status, 400);
  const saved = await agent.put('/api/review/plan').send({ minutes: 1 });
  assert.equal(saved.status, 200);
  assert.equal(saved.body.cards.length, 2);
  assert.equal((await agent.get('/api/review/plan')).body.minutes, 1);
  assert.equal((await other.agent.get('/api/review/plan')).body.minutes, 10);
  assert.equal((await other.agent.get(`/api/review?deck=${deck.id}`)).body.cards.length, 0);
  const input = { id: randomUUID(), card_id: deck.cards[0].id, rating: 'good', seconds: 60 };
  const response = await agent.post('/api/review').send(input);
  assert.equal(response.status, 200);
  assert.equal(response.body.remaining_seconds, 0);
  assert.ok(response.body.due > Date.now() / 1000 + 86400);
  const repeat = await agent.post('/api/review').send(input);
  assert.equal(repeat.body.duplicate, true);
  assert.equal((await agent.get(`/api/review?deck=${deck.id}`)).body.cards.length, 0);
  assert.equal((await agent.post('/api/review').send({ ...input, id: randomUUID(), card_id: deck.cards[1].id })).status, 409);
  await agent.delete(`/api/decks/${deck.id}`).send({});
  assert.equal((await agent.get('/api/review/plan')).body.spent_seconds, 60);
  // Previous days do not consume today's allowance.
  await pool.query("UPDATE review_days SET day=day-1 WHERE user_id=$1 AND day=$2", [uid, bangkokDate(Date.now() / 1000)]);
  assert.equal((await agent.get('/api/review/plan')).body.remaining_seconds, 60);
});
test('parallel reviews cannot double-spend the last daily allowance', async () => {
  const { agent, uid, deck } = await account();
  await agent.put('/api/review/plan').send({ minutes: 1 });
  const results = await Promise.all(deck.cards.slice(0, 2).map(card => agent.post('/api/review').send({ id: randomUUID(), card_id: card.id, rating: 'again', seconds: 60 })));
  assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  const plan = (await agent.get('/api/review/plan')).body;
  assert.equal(plan.spent_seconds, 60);
  assert.equal(plan.days[0].count, 0);
  assert.equal(plan.days[1].count, 1); // recent 60-second answer sets the estimate
  assert.equal((await pool.query('SELECT count(*)::int n FROM reviews WHERE user_id=$1', [uid])).rows[0].n, 1);
});
