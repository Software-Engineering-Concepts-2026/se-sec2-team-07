export function assertTestDatabase(env = process.env) {
  let test, runtime;
  try {
    test = new URL(env.TEST_DATABASE_URL);
    runtime = env.DATABASE_URL ? new URL(env.DATABASE_URL) : null;
  } catch {
    throw Error('A dedicated local TEST_DATABASE_URL is required');
  }
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(test.hostname) ||
    !/test/i.test(test.pathname)
  ) {
    throw Error('Destructive test suites are restricted to a local database with test in its name');
  }
  const host = (url) =>
    ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ? 'local' : url.hostname;
  if (
    runtime &&
    host(runtime) === host(test) &&
    (runtime.port || '5432') === (test.port || '5432') &&
    runtime.pathname === test.pathname
  ) {
    throw Error('TEST_DATABASE_URL must not be the application database');
  }
  return env.TEST_DATABASE_URL;
}

export function connectionOptions(databaseUrl, verifyTls = false) {
  if (!verifyTls) return { connectionString: databaseUrl };
  const url = new URL(databaseUrl);
  // URL sslmode would otherwise override pg's explicit certificate verification.
  for (const key of ['sslmode', 'ssl', 'sslcert', 'sslkey', 'sslrootcert'])
    url.searchParams.delete(key);
  return { connectionString: url.toString(), ssl: { rejectUnauthorized: true } };
}

export function assertSupabaseTarget(raw, projectRef, { migration = false } = {}) {
  if (!projectRef || !/^[a-z0-9]{20}$/.test(projectRef))
    throw Error('Set the verified SUPABASE_PROJECT_REF first');
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw Error('Supabase connection URL is missing or invalid');
  }
  const direct = url.hostname === `db.${projectRef}.supabase.co`;
  const pooled =
    url.hostname.endsWith('.pooler.supabase.com') &&
    decodeURIComponent(url.username).endsWith(`.${projectRef}`);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    (!direct && !pooled) ||
    url.pathname !== '/postgres'
  ) {
    throw Error('Database destination does not match the verified Supabase project');
  }
  if (migration && url.port && url.port !== '5432')
    throw Error('Migrations require direct or session mode on port 5432');
  if (url.searchParams.has('options') || url.searchParams.has('schema'))
    throw Error('Custom database schema options are not supported for Supabase deployment');
  return url;
}
