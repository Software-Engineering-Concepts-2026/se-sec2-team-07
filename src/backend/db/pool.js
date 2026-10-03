import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { connectionOptions } from './targets.js';

export function createPool(config) {
  const pool = new pg.Pool({ ...connectionOptions(config.databaseUrl, config.databaseSsl),
    max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 5000 });
  pool.prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  const close = pool.end.bind(pool);
  pool.end = async () => { await pool.prisma.$disconnect(); await close(); };
  return pool;
}

export async function transaction(pool, operation) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
