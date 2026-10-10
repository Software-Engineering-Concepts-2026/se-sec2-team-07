# Supabase runtime cleanup — 2026-10-04

- Removed Sprint 1 HTML/CSS/wireframes and unused Python stats service. Git history retains recovery copies.
- Removed the obsolete SQLite import command and its test. Existing local database files were not deleted.
- Runtime requires Supabase outside NODE_ENV=test; no local application fallback. Compose starts only the app.
- Renamed db:local to db:test:local. The helper creates only focus_test and never creates/overwrites .env.
- Retained Prisma migrations, local SQL test fixtures and mocked AI test responses. These protect regression behavior and do not supply mock data to the running application.
- AI_USAGE.md is the user's existing edit and is excluded from the cleanup commits.
- No remote schema/data mutations are part of this cleanup. Docker execution and live browser flows remain unverified for this change.

Validation: 40 unit tests passed, including enforcing Supabase runtime configuration; Vite production build passed. API integration and browser suites were not rerun for this cleanup; earlier migration results are recorded separately in supabase-prisma.md.

The verified Supabase read-only connection check also passed and found all migrated application tables. No migration was applied by this check.
