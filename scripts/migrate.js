import { readConfig } from '../src/backend/config.js';
import { createPool } from '../src/backend/db/pool.js';
import { migrate } from '../src/backend/db/migrate.js';
const pool = createPool(readConfig());
try { await migrate(pool); console.log('Database migrations complete.'); }
finally { await pool.end(); }
