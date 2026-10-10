import { mkdir, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { X509Certificate } from 'node:crypto';

const runtimeDirectory = '/tmp/focus-flashcards';
await mkdir(`${runtimeDirectory}/ocr`, { recursive: true });

// Node reads extra CA certificates at process startup, before loading the server.
const env = { ...process.env };
if (env.SUPABASE_CA_CERT && env.DATABASE_SSL_VERIFY !== 'false') {
  const certificate = env.SUPABASE_CA_CERT.replace(/\\n/g, '\n');
  new X509Certificate(certificate);
  const certificatePath = `${runtimeDirectory}/supabase.crt`;
  await writeFile(certificatePath, certificate, { mode: 0o600 });
  env.NODE_EXTRA_CA_CERTS = certificatePath;
  delete env.SUPABASE_CA_CERT;
}

const child = spawn(process.execPath, ['src/backend/server.js'], {
  env,
  stdio: 'inherit',
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => child.kill(signal));
}
child.on('error', () => {
  console.error('Unable to start the application server.');
  process.exit(1);
});
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
