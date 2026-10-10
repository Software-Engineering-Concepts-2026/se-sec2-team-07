# Docker

The active image builds React/Vite and runs Express with Prisma and Supabase. Configure server credentials in .env, run `npm run db:deploy:supabase`, then `docker compose up --build`. No local application database or Python service is started.

See [development instructions](../docs/development.md) for certificate trust, HTTPS and testing. Docker has not been re-tested during prototype cleanup.
