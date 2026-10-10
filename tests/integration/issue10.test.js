import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { createPool } from '../../src/backend/db/pool.js';
import { migrate } from '../../src/backend/db/migrate.js';
import { deckRepository } from '../../src/backend/modules/decks/repository.js';
import { createApp } from '../../src/backend/app.js';

if (!process.env.TEST_DATABASE_URL) throw Error('Dedicated TEST_DATABASE_URL required');
const config = {
  databaseUrl: process.env.TEST_DATABASE_URL,
  jwtSecret: 'sync-test-secret-at-least-32-characters',
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
async function user() {
  const agent = request.agent(app),
    email = `${randomUUID()}@example.com`;
  emails.push(email);
  assert.equal(
    (await agent.post('/api/register').send({ name: 'Sync', email, password: 'TestPassword123' }))
      .status,
    201,
  );
  return agent;
}
const cases = [
  {
    url: '/api/decks',
    input: { name: 'Original', cards: [{ front: 'Q', back: 'A' }] },
    edit: { name: 'Changed' },
    field: 'name',
    list: 'decks',
  },
  {
    url: '/api/notes',
    input: { title: 'Original', body: 'Note body' },
    edit: { title: 'Changed' },
    field: 'title',
    list: 'notes',
  },
];
async function read(agent, c, id) {
  return c.list === 'decks'
    ? (await agent.get(`${c.url}/${id}`)).body
    : (await agent.get(c.url)).body.notes.find((n) => n.id === id);
}
for (const c of cases) {
  test(`issue10 ${c.list}: concurrent retries, stale writes/deletes and durable receipt`, async () => {
    const agent = await user(),
      input = { ...c.input, request_id: randomUUID() };
    const created = await Promise.all([
      agent.post(c.url).send(input),
      agent.post(c.url).send({ ...input, request_id: input.request_id.toUpperCase() }),
    ]);
    assert.deepEqual(
      created.map((r) => r.status),
      [201, 201],
    );
    const id = created[0].body.id;
    assert.equal(created[1].body.id, id);
    assert.equal((await agent.get(c.url)).body[c.list].length, 1);
    const original = await read(agent, c, id);
    assert.equal(original.revision, 1);
    const update = { ...original, ...c.edit, request_id: randomUUID() };
    const updated = await Promise.all([
      agent.put(`${c.url}/${id}`).send(update),
      agent.put(`${c.url}/${id}`).send(update),
    ]);
    assert.deepEqual(
      updated.map((r) => r.status),
      [200, 200],
    );
    const current = await read(agent, c, id);
    assert.equal(current.revision, 2);
    assert.equal(current[c.field], 'Changed');
    assert.equal(
      (await agent.put(`${c.url}/${id}`).send({ ...original, request_id: randomUUID() })).status,
      409,
    );
    assert.equal((await agent.delete(`${c.url}/${id}`).send({ revision: 1 })).status, 409);
    assert.equal((await agent.post(c.url).send({ ...input, ...c.edit })).status, 409);
    assert.equal((await agent.delete(`${c.url}/${id}`).send({ revision: 2 })).status, 200);
    assert.equal((await agent.post(c.url).send(input)).body.id, id);
    assert.equal((await agent.put(`${c.url}/${id}`).send(update)).body.id, id);
    assert.equal((await agent.get(c.url)).body[c.list].length, 0);
  });
  test(`issue10 ${c.list}: concurrent distinct edits protect revision and receipts are owner scoped`, async () => {
    const agent = await user(),
      other = await user(),
      input = { ...c.input, request_id: randomUUID() };
    const id = (await agent.post(c.url).send(input)).body.id;
    const otherId = (await other.post(c.url).send(input)).body.id;
    assert.notEqual(id, otherId);
    const original = await read(agent, c, id);
    const results = await Promise.all(
      ['One', 'Two'].map((value) =>
        agent
          .put(`${c.url}/${id}`)
          .send({ ...original, [c.field]: value, request_id: randomUUID() }),
      ),
    );
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    assert.equal((await read(agent, c, id)).revision, 2);
    assert.equal(
      (await other.put(`${c.url}/${id}`).send({ ...original, request_id: randomUUID() })).status,
      404,
    );
    assert.equal((await other.delete(`${c.url}/${id}`).send({ revision: 2 })).status, 404);
    assert.equal((await agent.post(c.url).send({ ...c.input, request_id: 'bad' })).status, 400);
    assert.equal((await agent.delete(`${c.url}/${id}`).send({ revision: 0 })).status, 400);
  });
}
test('issue10 deck failures roll back cards, revision and retry receipt', async () => {
  const agent = await user(),
    c = cases[0];
  const id = (await agent.post(c.url).send(c.input)).body.id;
  const original = await read(agent, c, id),
    key = randomUUID();
  const invalid = {
    ...original,
    name: 'Should roll back',
    request_id: key,
    cards: [{ id: 2147483647, front: 'Invalid', back: 'Invalid' }],
  };
  assert.equal((await agent.put(`${c.url}/${id}`).send(invalid)).status, 400);
  assert.equal((await read(agent, c, id)).revision, 1);
  assert.equal((await read(agent, c, id)).name, 'Original');
  assert.equal(
    (await pool.query('SELECT * FROM sync_receipts WHERE request_id=$1', [key])).rowCount,
    0,
  );
  assert.equal(
    (await agent.put(`${c.url}/${id}`).send({ ...original, name: 'Recovered', request_id: key }))
      .status,
    200,
  );
});

test('issue10 deck GET retains one snapshot when another device edits between its reads', async () => {
  const agent = await user(),
    c = cases[0];
  const id = (await agent.post(c.url).send(c.input)).body.id;
  const original = await read(agent, c, id);
  const realRepo = deckRepository(pool);
  let edited = false;
  const interleavedPool = {
    async connect() {
      const client = await pool.connect();
      return {
        release: () => client.release(),
        async query(sql, values) {
          const result = await client.query(sql, values);
          if (sql.startsWith('SELECT * FROM decks')) {
            await realRepo.save(original.user_id, id, {
              ...original,
              cards: [{ ...original.cards[0], front: 'New front' }],
            });
            edited = true;
          }
          return result;
        },
      };
    },
  };
  const snapshot = await deckRepository(interleavedPool).get(original.user_id, id);
  assert.equal(edited, true);
  assert.equal(snapshot.revision, 1);
  assert.equal(snapshot.cards[0].front, 'Q');
  const latest = await realRepo.get(original.user_id, id);
  assert.equal(latest.revision, 2);
  assert.equal(latest.cards[0].front, 'New front');
});
