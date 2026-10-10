# ADR 0009: Static frontend on CDN and container API on Vercel

Status: Implemented; recorded 2026-10-10. Describes the current `vercel.json` deployment, not a new runtime change.

## Context

Serving the whole website through a sleeping container made initial page loads wait for API startup.
HTTPS cookies and origin checks also needed to work across generated Preview URLs and the stable Production domain.

## Decision

- Use Vercel Services (Beta) in one project on the same public origin.
- `web` builds React/Vite to `dist`; HTML, JavaScript, CSS, fonts and images come from the CDN.
- Route `/api` and `/api/*` to `api` using `Dockerfile.vercel`; other requests go to `web`.
- Keep API business modules in one Express modular monolith, not one microservice per feature.
- Run the API in `sin1`, matching the current Supabase pooler's region. Build location is a separate setting.
- Skip the blocking startup database check on Vercel only. Never migrate at startup. Health checks and authenticated requests still use the database.
- Keep API responses private with `Cache-Control: no-store`; static assets alone receive long-lived CDN caching.
- Keep secure HttpOnly cookies and exact origin checks. System variables supply generated Vercel/branch URLs. Accept the stable `vercel.app` Production domain from `VERCEL_PROJECT_PRODUCTION_URL` only when `VERCEL_ENV=production`. Custom origins use `APP_ORIGIN`.
- Use CLI deployments for this project's current workflow. Production requires explicit `deploy --prod`; automatic Git deployment needs separate integration and permission setup.
- Ordinary Docker/Compose and Docker Hub releases stay independent of Vercel deployments.

## Consequences

Static pages load independently of API startup, but registration, login and data reads can still wait for a cold container.
Services is Beta and subject to platform limits. The application's 20 MB file allowance does not override Vercel request-size limits.
OCR cache is ephemeral under `/tmp`; language models may need downloading after container replacement.
The PostgreSQL TLS verification exception is recorded in [ADR 0008](008-prisma-supabase.md).

Production and Preview use different environment-variable targets. A working Preview does not prove Production credentials or `APP_ORIGIN` are configured.
An origin-policy HTTP 403 is a configuration/authorization failure, not evidence of a failed database startup.

## Alternatives considered

- Entire SPA through the API container: rejected because static files then wait for container startup.
- Vite-only deployment: insufficient because persistence, extraction and generation require an API.
- Allow all `*.vercel.app` origins or arbitrary forwarded hosts: rejected because unrelated sites must not submit authenticated writes.
- Migrate the database during cold start: rejected because startup must not change schema.

## References

- [Routing](../../../vercel.json)
- [Container build](../../../Dockerfile.vercel)
- [Origin policy](../../../src/backend/middleware/api-policy.js)
- [Vercel guide](../../vercel.md)
- [Docker guide](../../docker.md)
