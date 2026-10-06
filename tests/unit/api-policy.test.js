import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { apiPolicy } from '../../src/backend/middleware/api-policy.js';
import { errorHandler } from '../../src/backend/middleware/error-handler.js';

function fixture() {
  const app = express();
  app.use(apiPolicy({ origin: 'https://focus.example' }));
  app.use(express.json());
  app.all('/', (req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

test('API keeps private headers and rejects cross-origin writes', async () => {
  const app = fixture();
  const response = await request(app).get('/').expect(200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-robots-tag'], 'noindex, nofollow');
  await request(app).post('/').set('Origin', 'https://other.example').send({}).expect(403);
  await request(app).post('/').set('Origin', 'https://focus.example').send({}).expect(200);
  await request(app).post('/').set('Host', 'focus.example').set('Origin', 'http://focus.example').send({}).expect(200);
});

test('API distinguishes unsupported content from malformed JSON', async () => {
  const app = fixture();
  await request(app).post('/').type('text').send('hello').expect(415);
  const response = await request(app).post('/').type('json').send('{broken').expect(400);
  assert.equal(response.body.error, 'JSON ไม่ถูกต้อง');
});
