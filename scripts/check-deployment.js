import assert from 'node:assert/strict';
import { setTimeout } from 'node:timers/promises';

const target = process.env.DEPLOYMENT_URL || process.argv[2];
const base = new URL(target);
assert.equal(base.protocol, 'https:', 'Deployment checks require an HTTPS URL.');
assert.ok(
  !base.username && !base.password && !base.search && !base.hash,
  'Deployment URL must not contain credentials, query parameters or fragments.',
);

async function request(path, options = {}) {
  return fetch(new URL(path, base), {
    redirect: 'error',
    signal: AbortSignal.timeout(30000),
    ...options,
  });
}
const page = await request('/');
assert.equal(page.status, 200, 'Website must be public and return HTTP 200.');
assert.match(page.headers.get('content-type') || '', /text\/html/);
const html = await page.text();
assert.match(html, /<div id="root">/, 'Expected the React application, not a platform error page.');
const assets = [...html.matchAll(/(?:src|href)="(\/assets\/[^"<>]+\.(?:js|css))"/g)];
assert.ok(assets.length >= 2, 'Expected built JavaScript and CSS assets.');
for (const [, path] of assets) {
  const asset = await request(path);
  assert.equal(asset.status, 200, `Missing static asset: ${path}`);
  assert.ok(
    !/text\/html/.test(asset.headers.get('content-type') || ''),
    `Asset returned HTML instead of its content: ${path}`,
  );
}

// A cold container may take time to start. A failing database is never accepted.
let healthy = false;
for (let attempt = 0; attempt < 6; attempt++) {
  try {
    const health = await request('/api/health');
    healthy = health.status === 200 && (await health.json()).ok === true;
    if (healthy) break;
  } catch {
    /* Retry only the read-only readiness endpoint. */
  }
  if (attempt < 5) await setTimeout(5000);
}
assert.ok(healthy, 'Database health check failed after retries.');
for (const path of ['/api/me', '/api/decks'])
  assert.equal((await request(path)).status, 401, `${path} must require authentication.`);
const login = await request('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: base.origin },
  body: '{}',
});
assert.equal(login.status, 400, 'Login must reach input validation without an Origin rejection.');
console.log(`Deployment verified: ${base.origin}`);
console.log('Passed: React HTML, static assets, database health, protected API and login Origin.');
