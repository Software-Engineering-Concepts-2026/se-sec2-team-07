import { readConfig } from './config.js';
import { createPool } from './db/pool.js';
import { migrate } from './db/migrate.js';
import { createApp } from './app.js';

const config = readConfig();
const pool = createPool(config);
await migrate(pool);
const server = createApp(pool, config).listen(config.port, config.host, () => {
  console.log(`Focus Flashcards API: http://${config.host}:${config.port}`);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => server.close(async () => { await pool.end(); process.exit(0); }));
}
