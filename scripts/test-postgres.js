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
for (const name of ['focus_test']) {
  if (!(await client.query('SELECT 1 FROM pg_database WHERE datname=$1', [name])).rowCount) await client.query(`CREATE DATABASE ${name}`);
}
await client.end();
console.log('Test database ready. Configure TEST_DATABASE_URL for focus_test using the local settings; application uses Supabase.');
console.log(`Local PostgreSQL running on 127.0.0.1:${settings.port}. Press Ctrl+C to stop.`);
const keepAlive = setInterval(() => {}, 60000);
let stopping = false;
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => {
  if (stopping) return; stopping = true; clearInterval(keepAlive); await database.stop(); process.exit(0);
});
