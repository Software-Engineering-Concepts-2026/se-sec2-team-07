# Supabase + Prisma migration

## Setup

Work from `C:\Users\Jaoo\Desktop\se-sec2-team-07`. Existing `.env`, local data and AI settings must be preserved. Never copy real credentials into `.env.example`.

1. Run `npm ci` (generates Prisma Client).
2. For a new local database: start `npm run db:local` in another terminal, then `npm run db:migrate`.
3. For the existing local app database: take a backup first, then `npm run db:migrate -- --baseline-legacy`. This verifies the six legacy migration records and schema equivalence before recording a Prisma baseline. No table/data reset is performed.
4. Start `npm run dev`. Startup no longer applies SQL migrations.

## Supabase

In Dashboard > Connect, obtain the project ref and PostgreSQL connection URIs. A database password is required, not an anon/service API key. URI-encode reserved characters in the password.

Set these server-only `.env` values yourself:

```dotenv
DATABASE_PROVIDER=local
SUPABASE_PROJECT_REF=your_20_character_project_ref
SUPABASE_DATABASE_URL=postgresql://...runtime_connection...
SUPABASE_DIRECT_URL=postgresql://...direct_or_session_connection...
```

On IPv4 networks, use the session pooler (5432) for migrations if the direct host is unreachable. Runtime can use the session pooler for this persistent Express server; transaction mode (6543) is supported by the driver but must not be used for migrations. Server role must own the tables or have BYPASSRLS and appropriate grants. TLS certificate verification stays enabled.

Run `npm run db:check:supabase` first. It validates both connection destinations against the project ref, connects read-only and lists public table names without printing credentials. Then run `npm run db:deploy:supabase` to apply checked-in Prisma migrations. Unknown pre-existing tables without Prisma history are refused. No reset or destructive overwrite fallback exists.

Only after successful deployment and runtime verification set `DATABASE_PROVIDER=supabase` and restart the backend. Keep `DATABASE_URL` pointing to the preserved local database for rollback and keep `TEST_DATABASE_URL` local. Do not put Supabase credentials in `TEST_DATABASE_URL`.

The initial migration creates users, decks, cards, reviews, review_days, courses, notes, course_cards, course_notes, documents and sync_receipts, plus legacy migration bookkeeping. Prisma adds its own migration history table. Relations, cascade deletes, checks, indexes and original bytea document storage are retained. RLS is enabled on application tables without anonymous policies; access goes through Express with existing owner checks.

## Verification

- Prisma format/generate succeeded with 7.10.0.
- Existing local test database baseline comparison succeeded without changing application rows.
- Existing API integration suite: 36/36 passed using real Prisma repositories.
- New isolated empty-database test: 1/1 passed; Prisma deploy created tables, relations and RLS, registration/duplicate email/deck/review worked, invalid check/FK writes were rejected, cascade deletion worked. Only its randomly named local test database was removed afterward.
- Database-target unit tests: 3/3 passed, including rejection of cloud test URLs, same runtime/test database, wrong Supabase ref and transaction-pool migration port.
- Production frontend build passed.
- Full unit suite: 39/39 passed. Full browser suite: 50/50 passed (Chrome desktop/mobile viewports, 2.1 minutes), including existing AI mock, editing, daily budget, courses, documents, sync, export and archive flows.

## Limits and rollback

Supabase settings were absent when implementation began. Remote tables, runtime credentials, certificate trust and real cloud latency remain unverified until credentials and project identity are supplied. No local user data was uploaded or copied to Supabase. AI provider code/settings were not changed and no live AI call was needed for this migration.

Return `DATABASE_PROVIDER=local` and restart to use the preserved local database; cloud writes are not automatically copied back. Reverting application commits does not remove cloud tables or restore data. Back up before any later data transfer or schema change. Never use `prisma migrate reset` against the application database.

Dependency audit after adding Prisma 7.10.0 reports CLI dependency advisories for deepmerge-ts and mysql2, plus ip-address in the existing dependency tree. No forced major downgrade/override was applied. Prisma CLI is excluded from the Docker runtime; Docker build and deployment were not exercised in this environment.
