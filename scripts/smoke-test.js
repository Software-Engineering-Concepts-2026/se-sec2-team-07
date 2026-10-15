import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/backend/app.js';
import { createPool } from '../src/backend/db/pool.js';
import { migrate } from '../src/backend/db/migrate.js';
import { assertTestDatabase } from '../src/backend/db/targets.js';

// The smoke test only uses an isolated local test database, never Supabase.
const config = {
  databaseUrl: assertTestDatabase(),
  jwtSecret: 'local-smoke-test-secret-at-least-32-characters',
  production: true,
  cookieSecure: true,
  trustProxy: 0,
};
const pool = createPool(config);
let server;
try {
  await migrate(pool);
  server = createApp(pool, config).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, options = {}) =>
    fetch(new URL(path, base), {
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
      ...options,
    });
  const page = await request('/');
  assert.equal(page.status, 200, 'Production build must serve the React page.');
  assert.match(page.headers.get('content-type') || '', /text\/html/);
  const html = await page.text();
  assert.match(html, /<div id="root">/);
  const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"<>]+\.(?:js|css))"/g)];
  assert.ok(
    assets.some(([, path]) => path.endsWith('.js')),
    'JavaScript bundle is missing.',
  );
  assert.ok(
    assets.some(([, path]) => path.endsWith('.css')),
    'Stylesheet is missing.',
  );
  for (const [, path] of assets) {
    const response = await request(path);
    assert.equal(response.status, 200, `Missing built asset: ${path}`);
    assert.doesNotMatch(response.headers.get('content-type') || '', /text\/html/);
    if (path.endsWith('.js'))
      assert.doesNotMatch(await response.text(), /__coverage__/, 'Build must not be instrumented.');
    else await response.arrayBuffer();
  }
  const health = await request('/api/health');
  assert.equal(health.status, 200);
  assert.equal((await health.json()).ok, true);
  for (const path of ['/api/me', '/api/decks']) {
    const response = await request(path);
    assert.equal(response.status, 401, `${path} must require authentication.`);
    await response.arrayBuffer();
  }
  const login = await request('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: base },
    body: '{}',
  });
  assert.equal(login.status, 400, 'Same-origin login must reach validation.');
  await login.arrayBuffer();
  console.log('Smoke test passed: built React page, assets, PostgreSQL, API protection and login.');
} finally {
  if (server) {
    server.closeAllConnections();
    await new Promise((done, reject) => server.close((error) => (error ? reject(error) : done())));
  }
  await pool.end();
}
