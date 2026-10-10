import { defineConfig } from 'prisma/config';
// CLI callers explicitly load .env. Never fall back to a production runtime URL.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: {
    url: process.env.DIRECT_URL || 'postgresql://invalid:invalid@127.0.0.1:1/not_configured',
  },
});
