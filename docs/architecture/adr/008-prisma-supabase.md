# ADR 008: Prisma with Supabase PostgreSQL

Date: 2026-10-03. Status: implemented locally; Supabase deployment pending verified connection settings.

## Decision

Use Prisma 7 with the PostgreSQL driver adapter and the existing pg connection pool. Prisma models map to existing snake_case tables/columns without changing IDs, timestamps, password hashes or foreign keys. Prisma handles authentication reads/writes, document CRUD and archived/active card listing. It is part of the production request path, not only a schema generator.

Keep the existing parameterized SQL transactions for deck/note saves, course links, review accounting, archive mutations and export snapshots. Their FOR UPDATE/advisory locks, repeatable-read snapshots and durable retry receipts must stay on one checked-out connection. Do not mix root Prisma calls into a pg transaction. All operations share the same pool but transactions retain their own connection. A future ORM conversion must preserve this locking contract and concurrency tests.

Prisma Migrate owns future schema changes. The initial migration preserves all six legacy SQL migrations, including CHECK constraints not represented in Prisma schema. Fresh databases also enable RLS on application tables with no public policies: Express keeps custom JWT authentication and owner checks. Use a server-only owner/BYPASSRLS database role; Supabase anon/authenticated access is not the app's authorization mechanism. Do not expose database credentials in Vite.

Runtime and migration credentials are separate. Supabase destinations must match an explicitly configured project ref; migrations require direct/session mode port 5432. Startup only checks database readiness and never migrates. Local legacy baselining compares the schema before marking the initial migration applied; it does not recreate tables or transfer data. Existing local RLS settings are preserved when baselining.

## Consequences

- Same PostgreSQL data model and custom authentication remain usable locally and on Supabase.
- Existing local data stays local; cloud data transfer needs a separate reviewed backup/restore procedure and is not implied by creating empty cloud tables.
- Test suites refuse non-local databases and the application database before cleanup hooks can run.
- Prisma generate runs after install. Docker generates the client in the build stage; deploy schema separately before starting runtime.
- Raw SQL remains intentionally in concurrency-sensitive paths. Prisma does not replace Supabase Auth or provide automatic user-level RLS for the custom JWT.

References: https://supabase.com/docs/guides/database/prisma and https://supabase.com/docs/guides/database/connecting-to-postgres
