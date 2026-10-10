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
  jwtSecret: 'courses-test-secret-at-least-32-characters',
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
        .send({ name: 'Courses', email, password: 'TestPassword123' })
    ).status,
    201,
  );
  const d = await agent.post('/api/decks').send({
    name: 'Original',
    cards: [
      { front: 'Stack?', back: 'LIFO' },
      { front: 'Queue?', back: 'FIFO' },
    ],
  });
  const deck = (await agent.get(`/api/decks/${d.body.id}`)).body;
  const note = (
    await agent.post('/api/notes').send({ title: 'Data notes', body: 'Stack is LIFO.' })
  ).body;
  const course = (await agent.post('/api/courses').send({ name: 'Data Structures' })).body;
  return { agent, deck, note, course };
}
test('cards and notes link to multiple courses once, propagate edits, and retain one review history', async () => {
  const { agent, deck, note, course } = await setup();
  const second = (await agent.post('/api/courses').send({ name: 'Algorithms' })).body;
  for (const target of [course, second]) {
    for (const [kind, id] of [
      ['cards', deck.cards[0].id],
      ['notes', note.id],
    ]) {
      const url = `/api/courses/${target.id}/${kind}/${id}`;
      const results = await Promise.all([agent.put(url).send({}), agent.put(url).send({})]);
      assert.ok(
        results.every((r) => r.status === 200),
        JSON.stringify(results.map((r) => r.body)),
      );
    }
  }
  const detail = (await agent.get(`/api/courses/${course.id}`)).body;
  assert.equal(detail.cards.length, 1);
  assert.equal(detail.notes.length, 1);
  assert.equal(detail.cards[0].courses.length, 2);
  assert.equal((await agent.get('/api/review')).body.cards.length, 2);
  assert.equal((await agent.get(`/api/review?course=${course.id}`)).body.cards.length, 1);
  deck.cards[0].front = 'Updated shared question';
  assert.equal((await agent.put(`/api/decks/${deck.id}`).send(deck)).status, 200);
  assert.equal(
    (await agent.put(`/api/notes/${note.id}`).send({ title: 'Updated note', body: 'Shared body' }))
      .status,
    200,
  );
  const other = (await agent.get(`/api/courses/${second.id}`)).body;
  assert.equal(other.cards[0].front, 'Updated shared question');
  assert.equal(other.notes[0].body, 'Shared body');
  assert.equal(
    (
      await agent
        .post('/api/review')
        .send({ id: randomUUID(), card_id: deck.cards[0].id, rating: 'good', seconds: 10 })
    ).status,
    200,
  );
  assert.equal((await agent.get(`/api/review?course=${second.id}`)).body.cards.length, 0);
  assert.equal((await agent.get('/api/stats')).body.total, 1);
  assert.equal(
    (await agent.delete(`/api/courses/${course.id}/cards/${deck.cards[0].id}`).send({})).status,
    200,
  );
  assert.equal((await agent.get(`/api/courses/${second.id}`)).body.cards.length, 1);
  assert.equal((await agent.get(`/api/decks/${deck.id}`)).body.cards[0].reviews, 1);
});
test('linked content cannot be deleted through notes, individual cards, or a whole deck; deleting a course preserves originals', async () => {
  const { agent, deck, note, course } = await setup();
  await agent.put(`/api/courses/${course.id}/cards/${deck.cards[0].id}`).send({});
  await agent.put(`/api/courses/${course.id}/notes/${note.id}`).send({});
  assert.equal((await agent.delete(`/api/notes/${note.id}`).send({})).status, 409);
  const removeDeck = await agent.delete(`/api/decks/${deck.id}`).send({});
  assert.equal(removeDeck.status, 409);
  assert.match(removeDeck.body.error, /Data Structures/);
  assert.equal(
    (
      await agent
        .put(`/api/decks/${deck.id}`)
        .send({ ...deck, name: 'Should roll back', cards: [deck.cards[1]] })
    ).status,
    409,
  );
  assert.equal((await agent.get(`/api/decks/${deck.id}`)).body.name, 'Original');
  assert.equal((await agent.delete(`/api/courses/${course.id}`).send({})).status, 200);
  assert.equal((await agent.get('/api/notes')).body.notes.length, 1);
  assert.equal((await agent.get(`/api/decks/${deck.id}`)).body.cards.length, 2);
  assert.equal((await agent.delete(`/api/notes/${note.id}`).send({})).status, 200);
  assert.equal((await agent.delete(`/api/decks/${deck.id}`).send({})).status, 200);
});
test('all course and note actions enforce both owners and reject invalid input', async () => {
  const own = await setup(),
    other = await setup();
  assert.equal((await request(app).get('/api/courses')).status, 401);
  for (const data of [{ name: '' }, { name: 'x'.repeat(121) }])
    assert.equal((await own.agent.post('/api/courses').send(data)).status, 400);
  assert.equal(
    (await own.agent.post('/api/notes').send({ title: 'Blank', body: ' ' })).status,
    400,
  );
  for (const method of ['get', 'put', 'delete']) {
    const req = own.agent[method](`/api/courses/${other.course.id}`);
    assert.equal((await (method === 'get' ? req : req.send({ name: 'Stolen' }))).status, 404);
  }
  for (const [kind, id] of [
    ['cards', other.deck.cards[0].id],
    ['notes', other.note.id],
  ]) {
    assert.equal(
      (await own.agent.put(`/api/courses/${own.course.id}/${kind}/${id}`).send({})).status,
      404,
    );
    assert.equal(
      (await own.agent.delete(`/api/courses/${own.course.id}/${kind}/${id}`).send({})).status,
      404,
    );
  }
  assert.equal(
    (await own.agent.put(`/api/courses/${other.course.id}/cards/${own.deck.cards[0].id}`).send({}))
      .status,
    404,
  );
  assert.equal(
    (await own.agent.put(`/api/notes/${other.note.id}`).send({ title: 'Stolen', body: 'No' }))
      .status,
    404,
  );
  assert.equal((await own.agent.delete(`/api/notes/${other.note.id}`).send({})).status, 404);
  const library = (await own.agent.get('/api/courses/library')).body;
  assert.equal(library.cards.length, 2);
  assert.equal(library.notes.length, 1);
  const filtered = await own.agent.get(`/api/review?course=${other.course.id}`);
  assert.ok(
    filtered.status === 404 || (filtered.status === 200 && filtered.body.cards.length === 0),
  );
});
test('concurrent linking and deleting a deck never leave a dangling relation or silently delete a successful link', async () => {
  const { agent, deck, course } = await setup();
  const [link, remove] = await Promise.all([
    agent.put(`/api/courses/${course.id}/cards/${deck.cards[0].id}`).send({}),
    agent.delete(`/api/decks/${deck.id}`).send({}),
  ]);
  assert.ok(
    (link.status === 200 && remove.status === 409) ||
      (link.status === 404 && remove.status === 200),
    `${link.status}/${remove.status}`,
  );
});

test('unlinking notes is idempotent and preserves the original and its other course', async () => {
  const { agent, note, course } = await setup();
  const second = (await agent.post('/api/courses').send({ name: 'Second course' })).body;
  for (const target of [course, second]) {
    assert.equal(
      (await agent.put(`/api/courses/${target.id}/notes/${note.id}`).send({})).status,
      200,
    );
  }
  for (let attempt = 0; attempt < 2; attempt++) {
    assert.equal(
      (await agent.delete(`/api/courses/${course.id}/notes/${note.id}`).send({})).status,
      200,
    );
  }
  assert.equal((await agent.get(`/api/courses/${course.id}`)).body.notes.length, 0);
  const remaining = (await agent.get(`/api/courses/${second.id}`)).body.notes;
  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].id, note.id);
  assert.equal(remaining[0].body, 'Stack is LIFO.');
  assert.equal((await agent.get('/api/notes')).body.notes.length, 1);
});

test('concurrent linking and deleting a note preserve successful links', async () => {
  const { agent, note, course } = await setup();
  const [link, remove] = await Promise.all([
    agent.put(`/api/courses/${course.id}/notes/${note.id}`).send({}),
    agent.delete(`/api/notes/${note.id}`).send({}),
  ]);
  assert.ok(
    (link.status === 200 && remove.status === 409) ||
      (link.status === 404 && remove.status === 200),
    `${link.status}/${remove.status}`,
  );
  const detail = (await agent.get(`/api/courses/${course.id}`)).body;
  assert.equal(detail.notes.length, link.status === 200 ? 1 : 0);
});

test('concurrent linking and removing a card through its editor preserve successful links', async () => {
  const { agent, deck, course } = await setup();
  const [link, edit] = await Promise.all([
    agent.put(`/api/courses/${course.id}/cards/${deck.cards[0].id}`).send({}),
    agent.put(`/api/decks/${deck.id}`).send({ ...deck, cards: [deck.cards[1]] }),
  ]);
  assert.ok(
    (link.status === 200 && edit.status === 409) || (link.status === 404 && edit.status === 200),
    `${link.status}/${edit.status}`,
  );
  const saved = (await agent.get(`/api/decks/${deck.id}`)).body;
  assert.equal(saved.cards.length, link.status === 200 ? 2 : 1);
});
