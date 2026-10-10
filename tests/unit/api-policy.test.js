import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { apiPolicy } from '../../src/backend/middleware/api-policy.js';
import { errorHandler } from '../../src/backend/middleware/error-handler.js';
import { readConfig } from '../../src/backend/config.js';
import { createApp } from '../../src/backend/app.js';

function vercelConfig(env = {}) {
  return readConfig({
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://test:test@localhost/test',
    JWT_SECRET: 'x'.repeat(32),
    APP_ORIGIN: 'http://localhost:5173',
    VERCEL_URL: 'focus-preview-123.vercel.app',
    VERCEL_BRANCH_URL: 'focus-git-feature.vercel.app',
    ...env,
  });
}

function fixture(config = { origin: 'https://focus.example' }) {
  const app = express();
  app.use(apiPolicy(config));
  app.use(express.json());
  app.all('/', (req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

test('Vercel preview accepts only its exact deployment origins behind an HTTP proxy', async () => {
  const config = vercelConfig();
  const app = fixture(config);
  for (const origin of config.deploymentOrigins)
    await request(app).post('/').set('Origin', origin).send({}).expect(200);
  for (const origin of [
    'https://other.vercel.app',
    'https://focus-preview-123.vercel.app.evil.com',
  ])
    await request(app).post('/').set('Origin', origin).send({}).expect(403);
});

test('production register and login accept the stable Vercel domain behind the container proxy', async () => {
  const config = vercelConfig({
    VERCEL_ENV: 'production',
    VERCEL_PROJECT_PRODUCTION_URL: 'focus-flashcards.vercel.app',
  });
  const app = createApp({}, config);
  for (const path of ['/api/register', '/api/login']) {
    // Empty credentials must reach validation without connecting to the database.
    await request(app)
      .post(path)
      .set('Host', '127.0.0.1:8000')
      .set('Origin', 'https://focus-flashcards.vercel.app')
      .send({})
      .expect(400);
    for (const origin of [
      'http://focus-flashcards.vercel.app',
      'https://other.vercel.app',
      'https://focus-flashcards.vercel.app.evil.com',
    ])
      await request(app)
        .post(path)
        .set('Origin', origin)
        .set('X-Forwarded-Host', 'focus-flashcards.vercel.app')
        .set('X-Forwarded-Proto', 'https')
        .send({})
        .expect(403);
  }
});

test('preview does not inherit the production alias and malformed aliases are ignored', async () => {
  for (const env of [
    { VERCEL_ENV: 'preview', VERCEL_PROJECT_PRODUCTION_URL: 'focus-flashcards.vercel.app' },
    {
      VERCEL_ENV: 'production',
      VERCEL_PROJECT_PRODUCTION_URL: 'focus-flashcards.vercel.app.evil.com',
    },
  ])
    await request(fixture(vercelConfig(env)))
      .post('/')
      .set('Origin', `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`)
      .send({})
      .expect(403);
});

test('APP_ORIGIN tolerates surrounding whitespace and a trailing slash on a custom domain', async () => {
  const config = vercelConfig({ APP_ORIGIN: ' https://focus.example/ ' });
  const app = fixture(config);
  await request(app).post('/').set('Origin', 'https://focus.example').send({}).expect(200);
  await request(app).post('/').set('Origin', 'https://other.example').send({}).expect(403);
});

test('API keeps private headers and rejects cross-origin writes', async () => {
  const app = fixture();
  const response = await request(app).get('/').expect(200);
  assert.equal(response.headers['cache-control'], 'no-store');
  assert.equal(response.headers['x-robots-tag'], 'noindex, nofollow');
  await request(app).post('/').set('Origin', 'https://other.example').send({}).expect(403);
  await request(app).post('/').set('Origin', 'https://focus.example').send({}).expect(200);
  await request(app)
    .post('/')
    .set('Host', 'focus.example')
    .set('Origin', 'http://focus.example')
    .send({})
    .expect(200);
});

test('API distinguishes unsupported content from malformed JSON', async () => {
  const app = fixture();
  await request(app).post('/').type('text').send('hello').expect(415);
  const response = await request(app).post('/').type('json').send('{broken').expect(400);
  assert.equal(response.body.error, 'JSON ไม่ถูกต้อง');
});
