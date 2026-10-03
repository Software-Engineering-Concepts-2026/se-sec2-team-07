import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createPool } from '../../src/backend/db/pool.js';
import { migrate } from '../../src/backend/db/migrate.js';
import { createApp } from '../../src/backend/app.js';

if (!process.env.TEST_DATABASE_URL) throw Error('Dedicated TEST_DATABASE_URL required');
const config = { databaseUrl: process.env.TEST_DATABASE_URL, jwtSecret: 'archive-test-secret-at-least-32-characters', cookieSecure: false, production: false, trustProxy: 0 };
const pool = createPool(config), app = createApp(pool, config), emails = [];
before(() => migrate(pool));
after(async () => { await pool.query('DELETE FROM users WHERE email=ANY($1::text[])', [emails]); await pool.end(); });
async function setup() {
  const agent = request.agent(app), email = `${randomUUID()}@example.com`; emails.push(email);
  const registered = await agent.post('/api/register').send({ name: 'Learner', email, password: 'TestPassword123' });
  assert.equal(registered.status, 201);
  const cookie = registered.headers['set-cookie'][0].split(';')[0];
  const created = await agent.post('/api/decks').send({ name: 'Archive test', cards: [{ front: 'Stack?', back: 'LIFO' }, { front: 'Queue?', back: 'FIFO' }] });
  assert.equal(created.status, 201);
  return { agent, cookie, deck: (await agent.get(`/api/decks/${created.body.id}`)).body };
}
const archive = (agent, id, archived = true) => agent.put(`/api/cards/${id}/archive`).send({ archived });
const rating = id => ({ id: randomUUID(), card_id: id, rating: 'good', seconds: 13 });

test('archive endpoints enforce ownership, authentication and strict boolean validation', async () => {
  const { agent, deck } = await setup(), { agent: other } = await setup(), id = deck.cards[0].id;
  assert.equal((await request(app).get('/api/cards')).status, 401);
  assert.equal((await archive(request(app), id)).status, 401);
  assert.equal((await archive(other, id)).status, 404);
  assert.equal((await archive(agent, 2147483647)).status, 404);
  for (const input of [{}, { archived: 'true' }, { archived: true, extra: 1 }]) assert.equal((await agent.put(`/api/cards/${id}/archive`).send(input)).status, 400);
  for (const query of ['archived=1', 'archived=true&archived=false', 'extra=true']) assert.equal((await agent.get(`/api/cards?${query}`)).status, 400);
  assert.equal((await archive(agent, id)).status, 200);
  assert.deepEqual((await other.get('/api/cards?archived=true')).body.cards, []);
  const archived = (await agent.get('/api/cards?archived=true')).body.cards;
  assert.deepEqual(archived.map(c => c.id), [id]);
  assert.equal(archived[0].deck_name, deck.name);
  assert.deepEqual((await agent.get('/api/cards')).body.cards.map(c => c.id), [deck.cards[1].id]);
});

test('archive excludes all deck/course review queues and forecasts, preserves originals and rejects stale editor/review', async () => {
  const { agent, deck } = await setup(), id = deck.cards[0].id;
  const course = await agent.post('/api/courses').send({ name: 'Shared topic' });
  assert.equal((await agent.put(`/api/courses/${course.body.id}/cards/${id}`).send({})).status, 200);
  const spent = (await agent.get('/api/review/plan')).body.spent_seconds;
  assert.equal((await archive(agent, id)).status, 200);
  for (const url of ['/api/review', `/api/review?deck=${deck.id}`, `/api/review?course=${course.body.id}`, '/api/review/plan']) {
    const result = await agent.get(url); assert.equal(result.status, 200);
    assert.ok(result.body.cards.every(c => c.id !== id));
    assert.ok(result.body.days.flatMap(d => d.cards).every(c => c.id !== id));
  }
  assert.equal((await agent.post('/api/review').send(rating(id))).status, 409);
  assert.equal((await agent.get('/api/review/plan')).body.spent_seconds, spent);
  assert.equal((await agent.put(`/api/decks/${deck.id}`).send(deck)).status, 409);
  const saved = (await agent.get(`/api/decks/${deck.id}`)).body;
  assert.equal(saved.cards[0].front, deck.cards[0].front);
  assert.equal(saved.cards[0].back, deck.cards[0].back);
  assert.equal(saved.cards[0].due, deck.cards[0].due);
  assert.equal(saved.revision, deck.revision + 1);
  assert.equal((await archive(agent, id)).status, 200);
  assert.deepEqual((await agent.get(`/api/decks/${deck.id}`)).body, saved);
  const listed = (await agent.get('/api/decks')).body.decks[0];
  assert.equal(listed.card_count, 2); assert.equal(listed.due_count, 1);
});

test('restore retains same card, schedule interval and history; committed review retries remain idempotent after archive', async () => {
  const { agent, deck } = await setup(), id = deck.cards[0].id, review = rating(id);
  assert.equal((await agent.post('/api/review').send(review)).status, 200);
  const stats = (await agent.get('/api/stats')).body;
  const reviewed = (await agent.get(`/api/decks/${deck.id}`)).body.cards[0];
  assert.equal((await archive(agent, id)).status, 200);
  const retry = await agent.post('/api/review').send(review);
  assert.equal(retry.status, 200); assert.equal(retry.body.duplicate, true);
  assert.deepEqual((await agent.get('/api/stats')).body, stats);
  const exported = await agent.post('/api/exports').send({ deck_ids: [deck.id], include_cards: true, include_learning: true, format: 'json' });
  assert.equal(exported.status, 200);
  const exportedDeck = JSON.parse(exported.body.content).decks[0];
  assert.deepEqual(exportedDeck.cards, deck.cards.map(({ front, back }) => ({ front, back })));
  assert.equal(exportedDeck.learning.attempts, 1);
  assert.equal((await archive(agent, id, false)).status, 200);
  const restoredDeck = (await agent.get(`/api/decks/${deck.id}`)).body;
  const restored = restoredDeck.cards[0];
  assert.equal(restored.id, id); assert.equal(restored.interval, reviewed.interval); assert.equal(restored.reviews, reviewed.reviews);
  assert.equal(restored.archived_at, null); assert.ok(restored.due <= Date.now() / 1000);
  assert.deepEqual((await agent.get('/api/stats')).body, stats);
  assert.ok((await agent.get('/api/review')).body.cards.some(c => c.id === id));
  assert.equal((await archive(agent, id, false)).status, 200);
  assert.deepEqual((await agent.get(`/api/decks/${deck.id}`)).body, restoredDeck);
  await agent.put('/api/review/plan').send({ minutes: 1 });
  assert.equal((await agent.post('/api/review').send({ ...rating(deck.cards[1].id), seconds: 60 })).status, 200);
  assert.deepEqual((await agent.get('/api/review')).body.cards, []);
});

test('concurrent archive and review serialize without losing history or spending rejected review time', async () => {
  const { agent, cookie, deck } = await setup(), id = deck.cards[0].id;
  const results = await Promise.all([
    request(app).put(`/api/cards/${id}/archive`).set('Cookie', cookie).send({ archived: true }),
    request(app).post('/api/review').set('Cookie', cookie).send(rating(id)),
  ]);
  assert.equal(results[0].status, 200); assert.ok([200, 409].includes(results[1].status));
  const accepted = results[1].status === 200;
  const card = (await agent.get(`/api/decks/${deck.id}`)).body.cards[0];
  assert.ok(card.archived_at); assert.equal(card.reviews, accepted ? 1 : 0);
  assert.equal((await agent.get('/api/review/plan')).body.spent_seconds, accepted ? 13 : 0);
  assert.equal((await agent.get('/api/stats')).body.total, accepted ? 1 : 0);
  assert.ok((await agent.get('/api/review')).body.cards.every(c => c.id !== id));
});
