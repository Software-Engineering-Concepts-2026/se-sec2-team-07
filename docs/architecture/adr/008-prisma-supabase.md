# ADR 0008: Prisma with Supabase PostgreSQL

Date: 2026-10-03. Status: Accepted and in use with Supabase PostgreSQL. Reviewed: 2026-10-10.

## Context

The application needed hosted PostgreSQL and maintainable CRUD while preserving tested transaction locks, snapshots and retry behavior. Schema deployment must stay separate from application startup.

## Decision

Use Prisma 7 with the PostgreSQL driver adapter and the existing pg connection pool. Prisma models map to existing snake_case tables/columns without changing IDs, timestamps, password hashes or foreign keys. Prisma handles authentication CRUD, document CRUD and archived/active card listing. Per-request session verification reads the user's token version through parameterized SQL. Both approaches are part of the production request path.

Keep the existing parameterized SQL transactions for deck/note saves, course links, review accounting, archive mutations and export snapshots. Their FOR UPDATE/advisory locks, repeatable-read snapshots and durable retry receipts must stay on one checked-out connection. Do not mix root Prisma calls into a pg transaction. All operations share the same pool but transactions retain their own connection. A future ORM conversion must preserve this locking contract and concurrency tests.

Prisma Migrate owns future schema changes. The initial migration preserves all six legacy SQL migrations, including CHECK constraints not represented in Prisma schema. Fresh databases also enable RLS on application tables with no public policies: Express keeps custom JWT authentication and owner checks. Use a server-only owner/BYPASSRLS database role; Supabase anon/authenticated access is not the app's authorization mechanism. Do not expose database credentials in Vite.

Runtime and migration credentials are separate. Supabase destinations must match an explicitly configured project ref; migrations require direct/session mode port 5432. Runtime always selects Supabase outside tests. Ordinary startup checks database readiness; Vercel skips the blocking check as described in [ADR 0009](0009-vercel-services.md). Neither mode runs migrations. `/api/health` and authenticated requests still use the real database. Historical legacy baselining compared schemas without recreating tables or transferring data.

Document originals use `documents.content` and extracted text uses `documents.body`. This differs from extracting text into an unsaved card/note draft; Supabase Storage is not used.

Certificate verification defaults to enabled. The current Vercel Dockerfile sets `DATABASE_SSL_VERIFY=false` at the user's request: PostgreSQL traffic stays encrypted but server identity is not verified. This does not disable HTTPS verification for AI requests. Restoration instructions are in the [Vercel guide](../../vercel.md).

## Alternatives considered

- Convert all queries to Prisma: not selected because the existing checked-out transactions must preserve locking and snapshot guarantees.
- Use Supabase Auth/client-side database access: not selected; Express retains custom JWT authentication and owner checks.
- Local runtime database fallback: removed so a misconfigured deployment cannot silently write to a different database.

## Consequences

- Local development and deployed web runtimes use Supabase; isolated tests use a separate local PostgreSQL database. Existing local data is not selected as a runtime fallback.
- Existing local data stays local; cloud data transfer needs a separate reviewed backup/restore procedure and is not implied by creating empty cloud tables.
- Test suites refuse non-local databases and the application database before cleanup hooks can run.
- Prisma generate runs after install. Docker generates the client in the build stage; deploy schema separately before starting runtime.
- Raw SQL remains intentionally in concurrency-sensitive paths. Prisma does not replace Supabase Auth or provide automatic user-level RLS for the custom JWT.

References: https://supabase.com/docs/guides/database/prisma and https://supabase.com/docs/guides/database/connecting-to-postgres

Implementation: [schema](../../../prisma/schema.prisma), [configuration](../../../src/backend/config.js), [development guide](../../development.md).
