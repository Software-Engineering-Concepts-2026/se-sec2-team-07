import { spawn } from 'node:child_process';
import { createServer } from 'vite';

// Vite may choose another port when 5173 is occupied. Authorize only the
// actual development origin, without changing .env or production policy.
const web = await createServer({ server: { host: '127.0.0.1' } });
await web.listen();
web.printUrls();
const origin = `http://127.0.0.1:${web.httpServer.address().port}`;
const backend = spawn(
  process.execPath,
  ['--watch', '--env-file-if-exists=.env', 'src/backend/server.js'],
  {
    stdio: 'inherit',
    windowsHide: true,
    env: { ...process.env, APP_ORIGIN: origin },
  },
);
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  backend.kill();
  await web.close();
  process.exitCode = code;
}
backend.on('error', (error) => {
  console.error(error.message);
  stop(1);
});
backend.on('exit', (code) => stop(code || 0));
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
