import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertTestDatabase } from '../src/backend/db/targets.js';

assertTestDatabase();
const directory = resolve('coverage');
// This fixed, generated directory never contains user data or application files.
await rm(directory, { recursive: true, force: true });
await mkdir(resolve(directory, 'v8'), { recursive: true });
const env = { ...process.env, NODE_V8_COVERAGE: resolve(directory, 'v8') };

async function run(args, extraEnv = {}) {
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
      env: { ...env, ...extraEnv },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) =>
      code === 0 ? done() : reject(Error(`${args.join(' ')} failed (${signal || code})`)),
    );
  });
}

try {
  await run(['scripts/migrate.js', '--test']);
  await run(['--test', 'tests/unit/*.test.js']);
  await run(['--test', '--test-concurrency=1', 'tests/integration/*.test.js']);
  await run(['node_modules/vite/bin/vite.js', 'build'], { VITE_COVERAGE: 'true' });
  await run(['node_modules/playwright/cli.js', 'test'], { COLLECT_COVERAGE: 'true' });
  await run([
    'node_modules/c8/bin/c8.js',
    'report',
    '--all',
    '--include=src/backend/**/*.js',
    '--temp-directory=coverage/v8',
    '--reports-dir=coverage/backend',
    '--reporter=json',
  ]);
  await run(['scripts/report-coverage.js']);
} finally {
  // Never leave an instrumented build behind for a later deploy.
  await run(['node_modules/vite/bin/vite.js', 'build'], { VITE_COVERAGE: 'false' });
}
