import { readdir, readFile } from 'node:fs/promises';
import { transaction } from './pool.js';

export async function migrate(pool) {
  // Retained only for local legacy/import test fixtures. Production uses Prisma Migrate.
  const host = new URL(pool.options.connectionString).hostname;
  if (!['localhost', '127.0.0.1', '[::1]'].includes(host))
    throw Error('Legacy SQL migration is local-only. Use the verified Prisma deployment command.');
  const folder = new URL('./migrations/', import.meta.url);
  await transaction(pool, async (client) => {
    await client.query('SELECT pg_advisory_xact_lock(7010701)');
    await client.query(
      'CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())',
    );
    for (const name of (await readdir(folder)).filter((n) => n.endsWith('.sql')).sort()) {
      if (
        !(await client.query('SELECT name FROM schema_migrations WHERE name=$1', [name])).rowCount
      ) {
        await client.query(await readFile(new URL(name, folder), 'utf8'));
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
      }
    }
  });
}
