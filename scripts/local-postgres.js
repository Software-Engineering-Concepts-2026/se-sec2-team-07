// Optional development helper. Starts a real PostgreSQL cluster isolated from other installations.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

await mkdir('.local', { recursive: true });
const settingsPath = '.local/postgres.json';
const settings = existsSync(settingsPath) ? JSON.parse(await readFile(settingsPath, 'utf8')) : {
  user: 'focus', password: randomBytes(24).toString('hex'), port: 15432,
};
await writeFile(settingsPath, JSON.stringify(settings), { mode: 0o600 });
const databaseDir = resolve('.local/postgres');
const database = new EmbeddedPostgres({ ...settings, databaseDir, persistent: true,
  authMethod: 'scram-sha-256', initdbFlags: ['--encoding=UTF8', '--locale=C'],
  postgresFlags: ['-h', '127.0.0.1'], onLog: message => console.log(String(message)), onError: message => console.error(String(message)),
});
if (!existsSync(resolve(databaseDir, 'PG_VERSION'))) await database.initialise();
await database.start();
const client = database.getPgClient('postgres', '127.0.0.1');
await client.connect();
for (const name of ['focus', 'focus_test']) {
  if (!(await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [name])).rowCount) await client.query(`CREATE DATABASE ${name}`);
}
await client.end();
if (!existsSync('.env')) {
  await writeFile('.env', `DATABASE_URL=postgresql://${settings.user}:${settings.password}@127.0.0.1:${settings.port}/focus\nTEST_DATABASE_URL=postgresql://${settings.user}:${settings.password}@127.0.0.1:${settings.port}/focus_test\nJWT_SECRET=${randomBytes(48).toString('hex')}\nHOST=127.0.0.1\nPORT=8000\nAPP_ORIGIN=http://127.0.0.1:5173\nCOOKIE_SECURE=false\n`, { mode: 0o600 });
  console.log('Created .env with local database configuration.');
} else console.log('Existing .env preserved. Connection settings are in .local/postgres.json.');
console.log(`Local PostgreSQL running on 127.0.0.1:${settings.port}. Press Ctrl+C to stop.`);
const keepAlive = setInterval(() => {}, 60000);
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  if (stopping) return; stopping = true; clearInterval(keepAlive); await database.stop(); process.exit(0);
});
