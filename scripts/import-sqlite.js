// One-time migration from the earlier Python app. The SQLite source is opened read-only.
import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { readConfig } from '../src/backend/config.js';
import { createPool, transaction } from '../src/backend/db/pool.js';
import { migrate } from '../src/backend/db/migrate.js';

const source = new DatabaseSync(resolve(process.argv[2] || 'data/focus.sqlite3'), { readOnly: true });
const pool = createPool(readConfig());
try {
  await migrate(pool);
  await transaction(pool, async client => {
    await client.query('LOCK TABLE users,decks,cards,reviews IN ACCESS EXCLUSIVE MODE');
    const populated = (await client.query('SELECT EXISTS(SELECT 1 FROM users) present')).rows[0].present;
    if (populated) throw Error('Destination already has users. Import requires an empty application database; no data was changed.');
    const tables = {
      users: ['id', 'name', 'email', 'password'],
      decks: ['id', 'user_id', 'name', 'description', 'category', 'color', 'created'],
      cards: ['id', 'deck_id', 'front', 'back', 'due', 'interval', 'reviews'],
      reviews: ['id', 'user_id', 'card_id', 'rating', 'seconds', 'created'],
    };
    for (const [table, columns] of Object.entries(tables)) {
      const rows = source.prepare(`SELECT ${columns.join(',')} FROM ${table}`).all();
      for (const row of rows) {
        await client.query(`INSERT INTO ${table}(${columns.join(',')}) VALUES(${columns.map((_, i) => `$${i + 1}`).join(',')})`, columns.map(column => row[column]));
      }
      if (table !== 'reviews') await client.query(`SELECT setval(pg_get_serial_sequence('${table}','id'), coalesce(max(id),1), max(id) IS NOT NULL) FROM ${table}`);
      console.log(`${table}: ${rows.length} imported`);
    }
  });
  console.log('Import complete. SQLite source preserved. Existing passwords still work; sign in again.');
} finally { source.close(); await pool.end(); }
