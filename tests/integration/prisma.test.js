import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import test from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import request from 'supertest';
import { createPool } from '../../src/backend/db/pool.js';
import { createApp } from '../../src/backend/app.js';
const exec = promisify(execFile);

test('Prisma deploy builds an empty database with relations, checks, RLS and working API', async () => {
  const admin = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const name = `prisma_test_${randomUUID().replaceAll('-', '')}`;
  const url = new URL(process.env.TEST_DATABASE_URL); url.pathname = '/' + name;
  let pool;
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    await exec(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy'], {
      env: { ...process.env, DIRECT_URL: url.toString() }, windowsHide: true,
    });
    const config = { databaseUrl: url.toString(), jwtSecret: 'prisma-test-secret-at-least-32-characters', production: false, cookieSecure: false, trustProxy: 0 };
    pool = createPool(config);
    const agent = request.agent(createApp(pool, config));
    assert.equal((await agent.post('/api/register').send({ name: 'Prisma', email: 'prisma@example.com', password: 'Password12345' })).status, 201);
    assert.equal((await agent.post('/api/register').send({ name: 'Duplicate', email: 'prisma@example.com', password: 'Password12345' })).status, 409);
    const saved = await agent.post('/api/decks').send({ name: 'Relations', cards: [{ front: 'Stack?', back: 'LIFO' }] });
    assert.equal(saved.status, 201);
    const user = await pool.prisma.user.findUnique({ where: { email: 'prisma@example.com' }, include: { decks: { include: { cards: true } } } });
    assert.equal(user.decks[0].cards[0].back, 'LIFO');
    const card = user.decks[0].cards[0];
    assert.equal((await agent.post('/api/review').send({ id: randomUUID(), card_id: card.id, rating: 'good', seconds: 10 })).status, 200);
    assert.equal((await pool.prisma.review.findMany()).length, 1);
    await assert.rejects(pool.query('UPDATE users SET review_minutes=0 WHERE id=$1', [user.id]), { code: '23514' });
    await assert.rejects(pool.query('INSERT INTO course_cards(course_id,card_id) VALUES(-1,$1)', [card.id]), { code: '23503' });
    const secured = (await pool.query("SELECT relname FROM pg_class JOIN pg_namespace n ON n.oid=relnamespace WHERE n.nspname='public' AND relrowsecurity")).rows;
    assert.equal(secured.length, 12);
    await pool.prisma.user.delete({ where: { id: user.id } });
    assert.equal(await pool.prisma.card.count(), 0);
    assert.equal(await pool.prisma.review.count(), 0);
  } finally {
    await pool?.end();
    await admin.query(`DROP DATABASE IF EXISTS "${name}"`);
    await admin.end();
  }
});
