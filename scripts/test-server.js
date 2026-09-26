import { createPool } from '../src/backend/db/pool.js';
import { migrate } from '../src/backend/db/migrate.js';
import { createApp } from '../src/backend/app.js';
if (!process.env.TEST_DATABASE_URL) throw Error('TEST_DATABASE_URL required.');
// Isolated test server creates many independent users on one loopback IP.
// Production and ordinary development retain the default 20 attempts / 5 minutes.
const config = { databaseUrl: process.env.TEST_DATABASE_URL, jwtSecret: 'browser-test-secret-at-least-32-characters', cookieSecure: false, production: false, trustProxy: 0, authRateLimit: 1000 };
const pool = createPool(config); await migrate(pool);
const server = createApp(pool, config).listen(8001, '127.0.0.1');
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
