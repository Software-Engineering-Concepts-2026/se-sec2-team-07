import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../src/backend/app.js';

for (const configuration of [{ production: false }, { production: true, authRateLimit: 1000 }]) {
  test(`auth limits remain 20 attempts outside the isolated test harness (production=${configuration.production})`, async () => {
    const app = createApp(null, { trustProxy: 0, jwtSecret: 'test-secret-only', ...configuration });
    for (let attempt = 0; attempt < 20; attempt++) {
      assert.equal((await request(app).post('/api/register').send({})).status, 400);
    }
    assert.equal((await request(app).post('/api/register').send({})).status, 429);
  });
}
