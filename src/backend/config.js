import { assertSupabaseTarget } from './db/targets.js';

export function readAiConfig(env = process.env) {
  const aiBaseUrl = (env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(
    /\/+$/,
    '',
  );
  const url = new URL(aiBaseUrl);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash)
    throw Error('OPENAI_BASE_URL must be an HTTPS URL without credentials, query or fragment');
  const aiApi =
    env.OPENAI_API_MODE?.trim() || (url.hostname === 'api.openai.com' ? 'responses' : 'chat');
  if (!['responses', 'chat'].includes(aiApi))
    throw Error('OPENAI_API_MODE must be responses or chat');
  return { aiKey: env.OPENAI_API_KEY?.trim(), aiModel: env.OPENAI_MODEL?.trim(), aiBaseUrl, aiApi };
}

export function readConfig(env = process.env) {
  // Local connections are reserved for isolated test fixtures.
  const supabase = env.NODE_ENV !== 'test';
  if (supabase) assertSupabaseTarget(env.SUPABASE_DATABASE_URL, env.SUPABASE_PROJECT_REF);
  const databaseUrl = supabase ? env.SUPABASE_DATABASE_URL : env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required. Copy .env.example to .env.');
  if (!env.JWT_SECRET || env.JWT_SECRET.length < 32 || env.JWT_SECRET.startsWith('replace-')) {
    throw new Error('JWT_SECRET must be a random secret of at least 32 characters.');
  }
  const production = env.NODE_ENV === 'production';
  const cookieSecure = env.COOKIE_SECURE ? env.COOKIE_SECURE === 'true' : production;
  if (production && !cookieSecure)
    throw new Error('Production requires COOKIE_SECURE=true and HTTPS.');
  return {
    databaseUrl,
    jwtSecret: env.JWT_SECRET,
    production,
    cookieSecure,
    databaseSsl: supabase || env.DATABASE_SSL === 'true',
    databaseSslVerify: env.DATABASE_SSL_VERIFY !== 'false',
    port: Number(env.PORT || 8000),
    host: env.HOST || '127.0.0.1',
    origin: env.APP_ORIGIN,
    deploymentOrigins: [env.VERCEL_URL, env.VERCEL_BRANCH_URL]
      .filter((host) => typeof host === 'string' && /^[a-z0-9-]+\.vercel\.app$/i.test(host))
      .map((host) => `https://${host.toLowerCase()}`),
    trustProxy: Number(env.TRUST_PROXY || 0),
    ...readAiConfig(env),
  };
}
