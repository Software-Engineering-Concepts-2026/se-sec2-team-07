import { readConfig } from './config.js';
import { createPool } from './db/pool.js';
import { createApp } from './app.js';

const config = readConfig();
const pool = createPool(config);
// Schema deployment is explicit; starting the web server never alters tables.
try { await pool.prisma.user.count(); }
catch {
  console.error('Database is not ready. Check the connection and apply Prisma migrations before starting the server.');
  await pool.end();
  process.exit(1);
}
const server = createApp(pool, config).listen(config.port, config.host, () => {
  console.log(`Focus Flashcards API: http://${config.host}:${config.port}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
}
