import { readConfig } from './config.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';

// Preserve the database TLS setting previously supplied by Dockerfile.vercel.
const config = readConfig({
  ...process.env,
  DATABASE_SSL_VERIFY: process.env.DATABASE_SSL_VERIFY ?? 'false',
});

// Module state survives warm invocations; don't open a pool or check the schema per request.
const pool = createPool(config);
export default createApp(pool, config);
