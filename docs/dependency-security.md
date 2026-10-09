# Dependency security update — 2026-10-08

Production npm audit initially reported six affected packages (including parent packages).

- proxy-addr 2.0.7 → 2.0.8: IP spoofing with particular trusted IPv6 subnet configurations (GHSA-jqcg-44mw-7w3h). This app configures numeric proxy hops, not the vulnerable subnet form; keep the patch regardless.
- ip-address 10.7.0 → 10.7.3: mixed-family subnet checks and unbounded diagnostic work.
- deepmerge-ts 7.1.5 → 8.0.2: recursive graph stack exhaustion. Used through Prisma configuration.
- mysql2 3.15.3 → 3.24.5: authentication downgrade and compressed protocol resource exhaustion. The app uses PostgreSQL; this package is a Prisma dependency.
- Development dependencies: shell-quote → 1.12.0 (command injection), source-map-js → 1.2.2 (resource exhaustion).

Overrides pin deepmerge-ts, mysql2 and shell-quote because their parents retain vulnerable constraints. Revisit these overrides when upstream dependencies accept patched releases. Prisma stays on 7.10.0; no database reset or production migration was performed.

Validation: npm audit and npm audit --omit=dev report zero known vulnerabilities; Prisma generate and validate pass; 49 unit and 36 isolated database integration tests pass; frontend build passes. Integration tests initially failed because local PostgreSQL was stopped, then passed after starting it. No live AI, full browser suite, or OS-image vulnerability scan was performed for this change. A clean npm audit is not a guarantee of zero vulnerabilities.

The previously published image tag 2026-10-08-5ea12e3 is immutable for this update and still contains the old dependencies; use a newly built image for the fix.
