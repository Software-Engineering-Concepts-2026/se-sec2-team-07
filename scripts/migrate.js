import pg from 'pg';
import { spawnSync } from 'node:child_process';
import { assertSupabaseTarget, assertTestDatabase, connectionOptions } from '../src/backend/db/targets.js';

const mode = process.argv.includes('--supabase') ? 'supabase' : process.argv.includes('--test') ? 'test' : 'local';
const baseline = process.argv.includes('--baseline-legacy');
const checkOnly = process.argv.includes('--check');
const initial = '20261003000000_initial';
let pool;
function cli(args, url) {
  // Never print the connection string or raw CLI errors containing host/credentials.
  const result = spawnSync(process.execPath, ['node_modules/prisma/build/index.js', ...args], {
    env: { ...process.env, DIRECT_URL: url }, encoding: 'utf8', windowsHide: true,
  });
  return result;
}
try {
  let url;
  if (mode === 'supabase') {
    assertSupabaseTarget(process.env.SUPABASE_DATABASE_URL, process.env.SUPABASE_PROJECT_REF);
    assertSupabaseTarget(process.env.SUPABASE_DIRECT_URL, process.env.SUPABASE_PROJECT_REF, { migration: true });
    url = process.env.SUPABASE_DIRECT_URL;
    if (baseline) throw Error('Remote legacy baselining is disabled; review existing data separately');
  } else if (mode === 'test') url = assertTestDatabase();
  else {
    url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    const parsed = new URL(url);
    if (!['localhost', '127.0.0.1', '[::1]', 'db'].includes(parsed.hostname)) throw Error('Use --supabase with a verified project for remote migration');
  }
  pool = new pg.Pool({ ...connectionOptions(url, mode === 'supabase'), connectionTimeoutMillis: 10000 });
  const tables = (await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")).rows.map(r => r.tablename);
  console.log(`Verified ${mode} destination. Existing public tables: ${tables.join(', ') || '(none)'}`);
  if (checkOnly) { console.log('Read-only check complete. No migration applied.'); }
  else {
    if (tables.length && !tables.includes('_prisma_migrations') && !baseline) throw Error('Existing tables found. No changes made. Local legacy databases require --baseline-legacy after backup.');
    if (baseline) {
      if (tables.includes('_prisma_migrations')) throw Error('Already managed by Prisma; run without --baseline-legacy');
      if (!tables.includes('schema_migrations')) throw Error('Legacy migration history is missing');
      const names = (await pool.query('SELECT name FROM schema_migrations ORDER BY name')).rows.map(r => r.name);
      if (names.join(',') !== '001_initial.sql,002_review_budget.sql,003_courses_notes.sql,004_documents.sql,005_sync.sql,006_card_archive.sql') throw Error('Legacy migrations are not the expected six versions');
      const diff = cli(['migrate', 'diff', '--from-config-datasource', '--to-schema', 'prisma/schema.prisma', '--exit-code'], url);
      if (diff.status !== 0) throw Error('Legacy schema differs from Prisma or comparison failed. No baseline recorded.');
      const resolved = cli(['migrate', 'resolve', '--applied', initial], url);
      if (resolved.status !== 0) throw Error('Prisma baseline failed; check database access');
    }
    const result = cli(['migrate', 'deploy'], url);
    if (result.status !== 0) throw Error('Prisma migration failed; inspect migration status before retrying. No reset is performed.');
    console.log('Prisma migrations complete. Existing rows preserved.');
  }
} catch (error) {
  console.error(error.code ? `Database operation failed (${error.code}); check connectivity and permissions.` : error.message);
  process.exitCode = 1;
} finally { await pool?.end(); }
