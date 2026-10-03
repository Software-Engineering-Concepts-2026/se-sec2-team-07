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
const config = { databaseUrl: process.env.TEST_DATABASE_URL, jwtSecret: 'documents-test-secret-at-least-32-characters', cookieSecure: false, production: false, trustProxy: 0 };
const pool = createPool(config), app = createApp(pool, config), emails = [];
before(() => migrate(pool));
after(async () => { await pool.query('DELETE FROM users WHERE email=ANY($1::text[])', [emails]); await pool.end(); });
async function setup() {
  const agent = request.agent(app), email = `${randomUUID()}@example.com`; emails.push(email);
  assert.equal((await agent.post('/api/register').send({ name: 'Documents', email, password: 'TestPassword123' })).status, 201);
  return agent;
}
const text = '\uFEFFสรุปวิชา: โครงสร้างข้อมูล\r\nStack stores items in LIFO order.\r\n';
const upload = { name: 'บทเรียน.md', content: Buffer.from(text).toString('base64') };

test('documents persist originals byte for byte, searchable extracted text, rename, and deletion', async () => {
  const agent = await setup();
  const created = await agent.post('/api/documents').send(upload);
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const id = created.body.id;
  const listed = (await agent.get('/api/documents')).body.documents;
  assert.equal(listed.length, 1);
  assert.equal(listed[0].title, 'บทเรียน');
  assert.equal(listed[0].name, upload.name);
  assert.match(listed[0].body, /LIFO/);
  assert.ok(listed[0].created);
  assert.equal('content' in listed[0], false);
  const file = await agent.get(`/api/documents/${id}/download`);
  assert.equal(file.status, 200);
  assert.equal(file.headers['content-type'], 'application/octet-stream');
  assert.match(file.headers['content-disposition'], /^attachment;/);
  assert.deepEqual(file.body, Buffer.from(text));
  assert.equal((await agent.put(`/api/documents/${id}`).send({ title: '  Renamed lesson  ' })).status, 200);
  assert.equal((await agent.get('/api/documents')).body.documents[0].title, 'Renamed lesson');
  assert.equal((await agent.put(`/api/documents/${id}`).send({ title: ' ' })).status, 400);
  assert.equal((await agent.delete(`/api/documents/${id}`).send({})).status, 200);
  assert.deepEqual((await agent.get('/api/documents')).body.documents, []);
  assert.equal((await agent.get(`/api/documents/${id}/download`)).status, 404);
});

test('document operations isolate owners and require authentication', async () => {
  const owner = await setup(), other = await setup();
  const id = (await owner.post('/api/documents').send(upload)).body.id;
  assert.equal((await request(app).get('/api/documents')).status, 401);
  assert.equal((await request(app).get(`/api/documents/${id}/download`)).status, 401);
  assert.deepEqual((await other.get('/api/documents')).body.documents, []);
  assert.equal((await other.get(`/api/documents/${id}/download`)).status, 404);
  assert.equal((await other.put(`/api/documents/${id}`).send({ title: 'Stolen' })).status, 404);
  assert.equal((await other.delete(`/api/documents/${id}`).send({})).status, 404);
  assert.equal((await owner.get(`/api/documents/${id}/download`)).status, 200);
});

test('invalid documents never persist and download names discard path and control characters', async () => {
  const agent = await setup();
  for (const input of [
    { ...upload, name: 'program.exe' },
    { ...upload, name: 'broken.pdf' },
    { ...upload, content: 'not base64!' },
    { ...upload, title: '' },
    { ...upload, content: Buffer.from('tiny').toString('base64') },
  ]) assert.equal((await agent.post('/api/documents').send(input)).status, 400);
  assert.deepEqual((await agent.get('/api/documents')).body.documents, []);
  const created = await agent.post('/api/documents').send({ ...upload, name: '../folder\\safe\r\n.md' });
  assert.equal(created.status, 201);
  assert.equal((await agent.get('/api/documents')).body.documents[0].name, 'safe.md');
  const file = await agent.get(`/api/documents/${created.body.id}/download`);
  assert.equal(file.headers['content-disposition'], 'attachment; filename="safe.md"');
});
