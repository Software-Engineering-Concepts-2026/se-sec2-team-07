import { spawn } from 'node:child_process';
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { assertTestDatabase } from '../src/backend/db/targets.js';

const directory = resolve('coverage');
const stages = ['unit', 'integration', 'browser'];
const selected = process.argv[2] || 'all';
if (![...stages, 'report', 'all'].includes(selected))
  throw Error(`Unknown coverage stage: ${selected}`);

async function reset(path) {
  const target = resolve(path);
  // Only generated coverage paths inside this checkout may be removed recursively.
  if (target !== directory && !target.startsWith(directory + sep))
    throw Error('Refusing to remove a path outside the coverage directory');
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
}

async function run(args, env = {}) {
  await new Promise((done, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: 'inherit',
      windowsHide: true,
      env: { ...process.env, ...env },
    });
    child.on('error', reject);
    child.on('exit', (code, signal) =>
      code === 0 ? done() : reject(Error(`${args.join(' ')} failed (${signal || code})`)),
    );
  });
}

async function collect(stage) {
  if (stage !== 'unit') assertTestDatabase();
  const raw = resolve(directory, 'v8', stage);
  await reset(raw);
  await mkdir(resolve(directory, 'inputs'), { recursive: true });
  const marker = resolve(directory, 'inputs', `${stage}.json`);
  await rm(marker, { force: true });
  const env = { NODE_V8_COVERAGE: raw };
  if (stage === 'unit') await run(['--test', 'tests/unit/*.test.js'], env);
  if (stage === 'integration') {
    await run(['scripts/migrate.js', '--test'], env);
    await run(['--test', '--test-concurrency=1', 'tests/integration/*.test.js'], env);
  }
  if (stage === 'browser') {
    await reset(resolve(directory, 'browser'));
    try {
      await run(['node_modules/vite/bin/vite.js', 'build'], { VITE_COVERAGE: 'true' });
      await run(['node_modules/playwright/cli.js', 'test'], {
        ...env,
        COLLECT_COVERAGE: 'true',
      });
    } finally {
      // Never leave an instrumented build behind for a later deploy.
      await run(['node_modules/vite/bin/vite.js', 'build'], { VITE_COVERAGE: 'false' });
    }
  }
  await writeFile(marker, JSON.stringify({ stage, completed: true }) + '\n');
}

async function report() {
  const merged = resolve(directory, 'v8-merged');
  await reset(merged);
  // Each Actions job uploads coverage/ with its stage subdirectory intact.
  // Reject missing/failed suites instead of publishing a partial coverage gate.
  for (const stage of stages) {
    const marker = JSON.parse(
      await readFile(resolve(directory, 'inputs', `${stage}.json`), 'utf8'),
    );
    if (marker.stage !== stage || marker.completed !== true)
      throw Error(`Coverage stage did not complete: ${stage}`);
    const raw = resolve(directory, 'v8', stage);
    const files = (await readdir(raw)).filter((name) => name.endsWith('.json'));
    if (!files.length) throw Error(`V8 coverage is missing for ${stage}`);
    for (const name of files)
      await copyFile(resolve(raw, name), resolve(merged, `${stage}-${name}`));
  }
  await run([
    'node_modules/c8/bin/c8.js',
    'report',
    '--all',
    '--include=src/backend/**/*.js',
    '--temp-directory=coverage/v8-merged',
    '--reports-dir=coverage/backend',
    '--reporter=json',
  ]);
  await run(['scripts/report-coverage.js']);
}

if (selected === 'all') {
  assertTestDatabase();
  await reset(directory);
  for (const stage of stages) await collect(stage);
  await report();
} else if (selected === 'report') await report();
else await collect(selected);
