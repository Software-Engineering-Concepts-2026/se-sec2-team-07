import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTestDatabase, assertSupabaseTarget, connectionOptions } from '../../src/backend/db/targets.js';
import { readConfig } from '../../src/backend/config.js';
test('runtime requires Supabase even when old local settings remain', () => {
  const base = { JWT_SECRET: 'x'.repeat(32), DATABASE_URL: 'postgresql://u:p@localhost/focus', DATABASE_PROVIDER: 'local' };
  assert.throws(() => readConfig(base));
  const url = 'postgresql://postgres:p@db.abcdefghijklmnopqrst.supabase.co:5432/postgres';
  const config = readConfig({ ...base, SUPABASE_PROJECT_REF: 'abcdefghijklmnopqrst', SUPABASE_DATABASE_URL: url });
  assert.equal(config.databaseUrl, url);
  assert.equal(config.databaseSsl, true);
});
test('test cleanup is confined to a distinct local test database', () => {
  const safe = 'postgresql://test:test@localhost:5432/focus_test';
  assert.equal(assertTestDatabase({ TEST_DATABASE_URL: safe }), safe);
  for (const value of ['postgresql://test:test@cloud.example/focus_test', 'postgresql://test:test@localhost/focus', undefined]) {
    assert.throws(() => assertTestDatabase({ TEST_DATABASE_URL: value }));
  }
  assert.throws(() => assertTestDatabase({ TEST_DATABASE_URL: safe, DATABASE_URL: safe.replace('localhost', '127.0.0.1') }));
});
test('Supabase project and migration connection must match explicitly', () => {
  const ref = 'abcdefghijklmnopqrst';
  assertSupabaseTarget(`postgresql://postgres:x@db.${ref}.supabase.co:5432/postgres`, ref, { migration: true });
  assertSupabaseTarget(`postgresql://postgres.${ref}:x@aws-0-region.pooler.supabase.com:6543/postgres`, ref);
  for (const url of [
    `postgresql://postgres.${ref}:x@aws-0-region.pooler.supabase.com:6543/postgres`,
    'postgresql://postgres:x@db.wrong.supabase.co:5432/postgres',
    `postgresql://postgres:x@db.${ref}.supabase.co:5432/other`,
  ]) assert.throws(() => assertSupabaseTarget(url, ref, { migration: true }));
});
test('Supabase certificate verification cannot be overridden by URL parameters', () => {
  const options = connectionOptions('postgresql://u:p@example.com/db?sslmode=no-verify', true);
  assert.equal(new URL(options.connectionString).searchParams.has('sslmode'), false);
  assert.equal(options.ssl.rejectUnauthorized, true);
});
