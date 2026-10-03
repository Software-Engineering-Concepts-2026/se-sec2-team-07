import { assertTestDatabase } from '../../src/backend/db/targets.js';
assertTestDatabase();
import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, rm, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import pg from 'pg';
import { hashPassword, verifyPassword } from '../../src/backend/modules/auth/service.js';
const exec = promisify(execFile);

test('SQLite import preserves cards, schedule, passwords and source; nonempty destination is refused', async () => {
  if (!process.env.TEST_DATABASE_URL) throw Error('TEST_DATABASE_URL required');
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  const schema = `migration_${randomUUID().replaceAll('-', '')}`;
  const directory = await mkdtemp(join(tmpdir(), 'focus-migration-'));
  const file = join(directory, 'source.sqlite3');
  const source = new DatabaseSync(file);
  const password = await hashPassword('MigrationPassword123');
  source.exec(`CREATE TABLE users(id INTEGER,name TEXT,email TEXT,password TEXT);
    CREATE TABLE decks(id INTEGER,user_id INTEGER,name TEXT,description TEXT,category TEXT,color TEXT,created REAL);
    CREATE TABLE cards(id INTEGER,deck_id INTEGER,front TEXT,back TEXT,due REAL,interval REAL,reviews INTEGER);
    CREATE TABLE reviews(id TEXT,user_id INTEGER,card_id INTEGER,rating TEXT,seconds INTEGER,created REAL);`);
  source.prepare('INSERT INTO users VALUES(7,?,?,?)').run('นักเรียน', 'migration@example.com', password);
  source.exec(`INSERT INTO decks VALUES(8,7,'Deck','','CS','purple',1);
    INSERT INTO cards VALUES(9,8,'Question','Answer',2000000000,4,1);
    INSERT INTO reviews VALUES('old-review',7,9,'easy',15,1);`);
  source.close();
  try {
    await pool.query(`CREATE SCHEMA ${schema}`);
    const url = new URL(process.env.TEST_DATABASE_URL); url.searchParams.set('options', `-c search_path=${schema}`);
    const env = { ...process.env, DATABASE_URL: url.toString(), JWT_SECRET: 'migration-test-secret-at-least-32-chars', NODE_ENV: 'test' };
    await exec(process.execPath, ['scripts/import-sqlite.js', file], { env, windowsHide: true });
    const card = (await pool.query(`SELECT * FROM ${schema}.cards WHERE id=9`)).rows[0];
    assert.deepEqual([card.front, card.due, card.interval, card.reviews], ['Question', 2000000000, 4, 1]);
    const user = (await pool.query(`SELECT * FROM ${schema}.users WHERE id=7`)).rows[0];
    assert.equal(await verifyPassword('MigrationPassword123', user.password), true);
    const sequence = (await pool.query(`INSERT INTO ${schema}.users(name,email,password) VALUES('New','new@example.com','placeholder') RETURNING id`)).rows[0];
    assert.equal(sequence.id, 8);
    await assert.rejects(exec(process.execPath, ['scripts/import-sqlite.js', file], { env, windowsHide: true }), /Destination already has users/);
    const original = new DatabaseSync(file, { readOnly: true });
    assert.equal(original.prepare('SELECT count(*) total FROM users').get().total, 1); original.close();
  } finally {
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await pool.end();
    await rm(file); await rmdir(directory);
  }
});
