export function readConfig(env = process.env) {
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is required. Copy .env.example to .env.');
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET.startsWith('replace-')) {
    throw new Error('JWT_SECRET must be a random secret of at least 32 characters.');
  }
  const production = env.NODE_ENV === 'production';
  const cookieSecure = env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : production;
  if (production && !cookieSecure) throw new Error('Production requires COOKIE_SECURE=true and HTTPS.');
  return {
    databaseUrl: env.DATABASE_URL, jwtSecret: env.JWT_SECRET, production, cookieSecure,
    databaseSsl: env.DATABASE_SSL === 'true',
    port: Number(env.PORT || 8000), host: env.HOST || '127.0.0.1',
    origin: env.APP_ORIGIN, trustProxy: Number(env.TRUST_PROXY || 0),
    aiKey: env.OPENAI_API_KEY?.trim(), aiModel: env.OPENAI_MODEL?.trim(),
  };
}
