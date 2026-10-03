import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { createPool } from '../../src/backend/db/pool.js';
import { migrate } from '../../src/backend/db/migrate.js';
import { createApp } from '../../src/backend/app.js';

if (!process.env.TEST_DATABASE_URL) throw Error('TEST_DATABASE_URL is required (use a dedicated test database).');
const config = { databaseUrl: process.env.TEST_DATABASE_URL, jwtSecret: 'integration-test-secret-with-at-least-32-characters',
  cookieSecure: false, production: false, trustProxy: 0, origin: 'http://localhost:5173' };
const pool = createPool(config);
const app = createApp(pool, config);
const accounts = [];
before(async () => { await migrate(pool); });
after(async () => { if (accounts.length) await pool.query('DELETE FROM users WHERE email=ANY($1::text[])', [accounts]); await pool.end(); });
async function account() {
  const agent = request.agent(app); const email = `${randomUUID()}@example.com`; accounts.push(email);
  const response = await agent.post('/api/register').send({ name: 'ผู้เรียน', email, password: 'Password123' });
  assert.equal(response.status, 201, JSON.stringify(response.body));
  return { agent, email, cookie: response.headers['set-cookie'][0].split(';')[0] };
}
const deckInput = { name: 'Data structures', cards: [{ front: 'Stack?', back: 'LIFO' }, { front: 'Queue?', back: 'FIFO' }] };
async function deck(agent) { const result = await agent.post('/api/decks').send(deckInput); assert.equal(result.status, 201); return (await agent.get(`/api/decks/${result.body.id}`)).body; }

test('JWT HttpOnly cookie, login, expiry, and logout revocation', async () => {
  const { agent, email, cookie } = await account();
  const me = await agent.get('/api/me'); assert.equal(me.status, 200);
  assert.match(me.headers['set-cookie'][0], /HttpOnly/); assert.match(me.headers['set-cookie'][0], /SameSite=Strict/);
  const expired = jwt.sign({ ver: 0 }, config.jwtSecret, { algorithm: 'HS256', subject: String(me.body.user.id), issuer: 'focus-flashcards', audience: 'focus-web', expiresIn: -1 });
  assert.equal((await request(app).get('/api/me').set('Cookie', `focus_token=${expired}`)).status, 401);
  assert.equal((await agent.post('/api/logout').send({})).status, 200);
  assert.equal((await request(app).get('/api/me').set('Cookie', cookie)).status, 401);
  assert.equal((await agent.post('/api/login').send({ email, password: 'Password123' })).status, 200);
  assert.equal((await agent.post('/api/login').send({ email, password: 'wrong-password' })).status, 401);
});
test('decks and reviews are isolated between owners', async () => {
  const { agent } = await account(); const { agent: other } = await account(); const d = await deck(agent);
  assert.deepEqual((await other.get('/api/decks')).body.decks, []);
  for (const method of ['get', 'put', 'delete']) {
    const req = other[method](`/api/decks/${d.id}`);
    const result = method === 'get' ? await req : await req.send(deckInput);
    assert.equal(result.status, 404);
  }
  assert.equal((await other.post('/api/review').send({ id: randomUUID(), card_id: d.cards[0].id, rating: 'easy', seconds: 1 })).status, 404);
});
test('atomic edit preserves schedule; invalid card ids roll back all changes', async () => {
  const { agent } = await account(); const d = await deck(agent);
  await agent.post('/api/review').send({ id: randomUUID(), card_id: d.cards[0].id, rating: 'good', seconds: 20 });
  d.cards[0].front = 'Edited';
  assert.equal((await agent.put(`/api/decks/${d.id}`).send(d)).status, 200);
  const edited = (await agent.get(`/api/decks/${d.id}`)).body;
  assert.equal(edited.cards[0].reviews, 1); assert.equal(edited.cards[0].interval, 2);
  d.revision = edited.revision;
  d.name = 'Rollback'; d.cards[0].id = 2147483647;
  assert.equal((await agent.put(`/api/decks/${d.id}`).send(d)).status, 400);
  assert.equal((await agent.get(`/api/decks/${d.id}`)).body.name, 'Data structures');
});
test('parallel review retries count once and conflicting ratings cannot overwrite', async () => {
  const { agent, cookie } = await account(); const d = await deck(agent);
  const review = { id: randomUUID(), card_id: d.cards[0].id, rating: 'easy', seconds: 15 };
  const responses = await Promise.all(Array.from({ length: 3 }, () => request(app).post('/api/review').set('Cookie', cookie).send(review)));
  assert.deepEqual(responses.map(r => r.status), [200, 200, 200]);
  assert.equal(responses.filter(r => r.body.duplicate).length, 2);
  assert.equal((await agent.post('/api/review').send({ ...review, id: randomUUID() })).status, 409);
  assert.equal((await agent.post('/api/review').send({ ...review, rating: 'again' })).status, 409);
  const stats = (await agent.get('/api/stats')).body;
  assert.deepEqual([stats.total, stats.accuracy, stats.streak, stats.seconds], [1, 100, 1, 15]);
  assert.equal((await agent.get(`/api/review?deck=${d.id}`)).body.cards.length, 1);
});
test('deletion cascades to cards and review history', async () => {
  const { agent } = await account(); const d = await deck(agent);
  await agent.post('/api/review').send({ id: randomUUID(), card_id: d.cards[0].id, rating: 'hard', seconds: 3 });
  assert.equal((await agent.delete(`/api/decks/${d.id}`).send({})).status, 200);
  assert.equal((await agent.get(`/api/decks/${d.id}`)).status, 404);
  assert.equal((await agent.get('/api/stats')).body.total, 0);
});
test('validation, cross-origin writes, extraction, and AI-not-configured', async () => {
  const { agent } = await account();
  assert.equal((await agent.post('/api/decks').send({ name: 'empty', cards: [] })).status, 400);
  assert.equal((await agent.post('/api/decks').set('Origin', 'https://evil.example').send(deckInput)).status, 403);
  assert.equal((await agent.post('/api/decks').type('text').send('{}')).status, 415);
  const text = 'Stack: LIFO\nQueue: FIFO';
  assert.equal((await agent.post('/api/extract').send({ name: 'notes.txt', content: Buffer.from(text).toString('base64') })).body.text, text);
  const generated = await agent.post('/api/generate').send({ text, mode: 'local', count: 5 });
  assert.equal(generated.body.cards.length, 2);
  assert.equal((await agent.post('/api/generate').send({ text, mode: 'ai' })).status, 503);
  assert.equal((await agent.get('/data/focus.sqlite3')).status, 404);
});


test('Issue 8 rejects unknown learning levels and preserves local generation', async () => {
  const { agent } = await account();
  const input = { text: 'Stack: LIFO\nQueue: FIFO', count: 5 };
  const invalid = await agent.post('/api/generate').send({ ...input, mode: 'ai', level: 'expert' });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.fields.includes('level'));
  for (const level of ['beginner', 'intermediate', 'advanced']) {
    const local = await agent.post('/api/generate').send({ ...input, mode: 'local', level });
    assert.equal(local.status, 200);
    assert.deepEqual(local.body.cards, [{ front: 'Stack', back: 'LIFO' }, { front: 'Queue', back: 'FIFO' }]);
  }
  assert.deepEqual((await agent.get('/api/decks')).body.decks, []);
});
