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
const config = {
  databaseUrl: process.env.TEST_DATABASE_URL,
  jwtSecret: 'exports-test-secret-at-least-32-characters',
  cookieSecure: false,
  production: false,
  trustProxy: 0,
};
const pool = createPool(config),
  app = createApp(pool, config),
  emails = [];
before(() => migrate(pool));
after(async () => {
  await pool.query('DELETE FROM users WHERE email=ANY($1::text[])', [emails]);
  await pool.end();
});
async function setup() {
  const agent = request.agent(app),
    email = `${randomUUID()}@example.com`;
  emails.push(email);
  assert.equal(
    (
      await agent
        .post('/api/register')
        .send({ name: 'ผู้เรียน', email, password: 'TestPassword123' })
    ).status,
    201,
  );
  const uid = (await agent.get('/api/me')).body.user.id;
  const created = await agent.post('/api/decks').send({
    name: 'เลือกชุดนี้',
    cards: [
      { front: 'คำถาม\nเต็ม', back: 'คำตอบ <ครบ>' },
      { front: 'คำถาม 2', back: 'คำตอบ 2' },
    ],
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const deck = (await agent.get(`/api/decks/${created.body.id}`)).body;
  return { agent, uid, deck };
}
const options = (id) => ({
  deck_ids: [id],
  include_cards: true,
  include_learning: true,
  format: 'json',
});
test('exports selected complete cards and accurately aggregates repeated reviews without changing data', async () => {
  const { agent, uid, deck } = await setup();
  await agent
    .post('/api/decks')
    .send({ name: 'DO NOT EXPORT', cards: [{ front: 'secret exclusion', back: 'excluded' }] });
  for (const [rating, seconds] of [
    ['good', 17],
    ['again', 23],
  ])
    await pool.query(
      'INSERT INTO reviews(id,user_id,card_id,rating,seconds,created) VALUES($1,$2,$3,$4,$5,extract(epoch from now()))',
      [randomUUID(), uid, deck.cards[0].id, rating, seconds],
    );
  const before = (await agent.get(`/api/decks/${deck.id}`)).body;
  const response = await agent.post('/api/exports').send(options(deck.id));
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const data = JSON.parse(response.body.content);
  assert.deepEqual(
    data.decks[0].cards,
    deck.cards.map(({ front, back }) => ({ front, back })),
  );
  assert.deepEqual(data.decks[0].learning, {
    total_cards: 2,
    reviewed_cards: 1,
    attempts: 2,
    seconds: 40,
    distribution: { again: 1, hard: 0, good: 1, easy: 0 },
    accuracy: 50,
  });
  assert.equal(response.body.content.includes('DO NOT EXPORT'), false);
  assert.equal(response.body.content.includes('@example.com'), false);
  assert.deepEqual((await agent.get(`/api/decks/${deck.id}`)).body, before);
  const html = await agent
    .post('/api/exports')
    .send({ ...options(deck.id), format: 'html', include_learning: false });
  assert.equal(html.status, 200);
  assert.match(html.body.content, /คำตอบ &lt;ครบ&gt;/);
  assert.equal(html.body.content.includes('ผลการทบทวน'), false);
});
test('exports are atomic owner scoped and reject invalid selections and unauthenticated requests', async () => {
  const owner = await setup(),
    other = await setup();
  assert.equal((await request(app).post('/api/exports').send(options(owner.deck.id))).status, 401);
  for (const ids of [
    [other.deck.id],
    [owner.deck.id, other.deck.id],
    [owner.deck.id, 2147483647],
  ]) {
    const response = await owner.agent
      .post('/api/exports')
      .send({ ...options(owner.deck.id), deck_ids: ids });
    assert.equal(response.status, 404);
    assert.equal('content' in response.body, false);
  }
  for (const patch of [
    { deck_ids: [] },
    { deck_ids: [owner.deck.id, owner.deck.id] },
    { include_cards: false, include_learning: false },
    { format: 'pdf' },
  ])
    assert.equal(
      (await owner.agent.post('/api/exports').send({ ...options(owner.deck.id), ...patch })).status,
      400,
    );
  const response = await owner.agent
    .post('/api/exports')
    .send({ ...options(owner.deck.id), include_cards: false });
  const data = JSON.parse(response.body.content);
  assert.equal(data.decks[0].learning.accuracy, null);
  assert.equal(data.decks[0].learning.total_cards, 2);
  assert.equal('cards' in data.decks[0], false);
});

test('multiple selected decks retain requested order and every card; deleted selection fails as a whole', async () => {
  const { agent, deck } = await setup();
  const secondCards = [
    { front: '第二問 🧠\nบรรทัดใหม่', back: 'Answer & details' },
    { front: 'Final question', back: 'Final answer' },
  ];
  const created = await agent
    .post('/api/decks')
    .send({ name: 'Second selected', cards: secondCards });
  assert.equal(created.status, 201);
  const secondId = created.body.id;
  const selected = { ...options(deck.id), deck_ids: [secondId, deck.id] };
  const exported = await agent.post('/api/exports').send(selected);
  assert.equal(exported.status, 200);
  const data = JSON.parse(exported.body.content);
  assert.deepEqual(
    data.decks.map((item) => item.name),
    ['Second selected', deck.name],
  );
  assert.deepEqual(data.decks[0].cards, secondCards);
  assert.deepEqual(
    data.decks[1].cards,
    deck.cards.map(({ front, back }) => ({ front, back })),
  );
  assert.equal((await agent.delete(`/api/decks/${secondId}`).send({})).status, 200);
  const stale = await agent.post('/api/exports').send(selected);
  assert.equal(stale.status, 404);
  assert.equal('content' in stale.body, false);
});
