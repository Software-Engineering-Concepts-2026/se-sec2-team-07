# Development: Supabase + Prisma

The active application is React/Vite + Express + Prisma/pg on Supabase PostgreSQL. Runtime no longer falls back to a local application database. Historical prototype pages and the placeholder Python service have been removed. AI configuration remains unchanged.

## Run

Configure `.env` from `.env.example`: SUPABASE_PROJECT_REF, SUPABASE_DATABASE_URL, SUPABASE_DIRECT_URL and JWT_SECRET. Keep credentials server-side. DATABASE_PROVIDER and DATABASE_URL no longer select the application database.

```powershell
npm ci
# If your connection needs the downloaded Supabase CA:
$env:NODE_EXTRA_CA_CERTS = "$PWD\.local\prod-ca-2021.crt"
npm run db:check:supabase
# Apply only pending migrations, never reset:
npm run db:deploy:supabase
npm run dev
```

Open http://127.0.0.1:5173. For a production build use `npm run build` followed by `npm start` (port 8000). Restart after environment changes. Set the CA variable again in a new terminal if required. Never disable TLS verification.

## Tests

Keep TEST_DATABASE_URL pointing to a separate local PostgreSQL database named focus_test. `npm run db:test:local` can start the existing embedded test cluster; it creates only focus_test and never overwrites .env. Existing local application data is left intact but is not used by the web app.

```powershell
npm run db:migrate:test
npm test
npm run test:integration
npm run build
npm run test:e2e
```

Tests reject remote database destinations before cleanup. Browser tests run against their own server on port 8001. Mock AI responses remain only in automated tests, so tests do not consume live AI quota. The manual text-splitting generation mode is a real supported feature, not prototype data.

## Docker

Deploy Prisma migrations from the host first, then `docker compose up --build`. Compose starts only the app connected to Supabase. It does not create a local application database. Local Compose binds port 8000 to loopback and uses development cookies; public deployment requires HTTPS and production cookie settings. For additional certificate trust, mount the CA read-only and set NODE_EXTRA_CA_CERTS inside the container. Docker execution has not been verified in this cleanup.

## Features and history

Saved cards, shared courses, daily review budgets, archive/restore, document storage and exports all use the real backend. Review/edit transactions intentionally retain tested SQL locks alongside Prisma CRUD. No cloud rows or applied migration files were removed.

See [Prisma migration evidence](testing/supabase-prisma.md) for historical migration results and [cleanup evidence](testing/supabase-runtime-cleanup.md) for the current changes. Older issue reports describe behavior and commands at their recorded dates; use this guide for current startup instructions.
