import { readConfig } from './config.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';

const config = readConfig();
const pool = createPool(config);
// Schema deployment is explicit; starting the web server never alters tables.
try {
  await pool.prisma.user.count();
} catch (error) {
  console.error(
    'Database is not ready. Check the connection and apply Prisma migrations before starting the server.',
  );
  // Do not log driver messages: they can contain connection details or SQL data.
  const safeCode = (value) =>
    typeof value === 'string' && /^[A-Z0-9_]{2,60}$/.test(value) ? value : 'UNKNOWN';
  console.error(`Database startup code: ${safeCode(error.code)}`);
  try {
    await pool.query('SELECT 1');
    console.error('Database connection works; check Prisma schema and migrations.');
  } catch (connectionError) {
    console.error(`Database connection code: ${safeCode(connectionError.code)}`);
  }
  await pool.end();
  process.exit(1);
}
const server = createApp(pool, config).listen(config.port, config.host, () => {
  console.log(`Focus Flashcards API: http://${config.host}:${config.port}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () =>
    server.close(async () => {
      await pool.end();
      process.exit(0);
    }),
  );
}
