import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

test('Node.js entry serves authentication validation without a startup database connection', async () => {
  const source = `
    import assert from 'node:assert/strict';
    import { once } from 'node:events';
    const { default: app } = await import('./src/backend/vercel.js');
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = 'http://127.0.0.1:' + server.address().port;
    try {
      const session = await fetch(base + '/api/me');
      assert.equal(session.status, 401);
      assert.equal(session.headers.get('cache-control'), 'no-store');
      const login = await fetch(base + '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Origin: base }, body: '{}',
      });
      assert.equal(login.status, 400);
      console.log('Native entry validation passed');
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  `;
  const { stdout } = await promisify(execFile)(
    process.execPath,
    ['--input-type=module', '-e', source],
    {
      timeout: 20000,
      windowsHide: true,
      env: {
        ...process.env,
        NODE_ENV: 'test',
        DATABASE_URL: 'postgresql://unused:unused@127.0.0.1:1/focus_test',
        JWT_SECRET: 'native-entry-isolated-test-secret-at-least-32-characters',
        COOKIE_SECURE: 'false',
        APP_ORIGIN: '',
        TRUST_PROXY: '0',
      },
    },
  );
  assert.match(stdout, /Native entry validation passed/);
});
