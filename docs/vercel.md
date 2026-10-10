# Vercel container deployment (preview first)

`vercel.json` places the container function in Singapore (`sin1`), next to this
project's Supabase pooler in `ap-southeast-1`. If the database region changes,
update this setting. The Vercel container skips the synchronous startup database
check (`DATABASE_STARTUP_CHECK=false`) so HTML and assets can be served immediately.
`/api/health` still checks the database, and authenticated APIs still verify users
against the database. Ordinary Docker/local startup checks remain enabled.

Database TLS certificate verification is disabled in Dockerfile.vercel at the
user's request (`DATABASE_SSL_VERIFY=false`). Traffic remains encrypted, but the
database server's identity is not verified. No SUPABASE_CA_CERT is required in
this mode. This affects PostgreSQL only, not HTTPS/AI requests. To restore
verification, set DATABASE_SSL_VERIFY=true in Vercel and configure the CA below.

This setup uses Vercel Services (Beta) in one project and on one domain.
The `web` service builds Vite to `dist` and serves HTML, JavaScript, fonts and images
from the CDN. The `api` service runs `Dockerfile.vercel` in Singapore; only `/api`
requests reach the container. Static page files no longer wait for an API cold start.
Use the repository root, not `src/frontend`, as the project root.
Service build/output settings are in `vercel.json`; leave dashboard overrides unset.
The existing Dockerfile and Docker Hub release are independent.

## Project settings

Set these in Vercel Settings → Environment Variables for the appropriate environment:

| Variable              | Value                                                                         |
| --------------------- | ----------------------------------------------------------------------------- |
| PORT                  | `8000` (required so Vercel routes to the app's port)                          |
| NODE_ENV              | `production`                                                                  |
| HOST                  | `0.0.0.0`                                                                     |
| COOKIE_SECURE         | `true`                                                                        |
| APP_ORIGIN            | Exact HTTPS origin used to open this deployment, without a trailing slash     |
| SUPABASE_PROJECT_REF  | Your existing database project reference                                      |
| SUPABASE_DATABASE_URL | Verified Supabase connection URL; use a separate database for preview testing |
| JWT_SECRET            | A strong random secret of at least 32 characters                              |
| SUPABASE_CA_CERT      | PEM contents of the verified Supabase CA certificate, when needed             |
| OPENAI_BASE_URL       | Your AI provider's HTTPS endpoint                                             |
| OPENAI_API_MODE       | `chat` or `responses`, as configured for your provider                        |
| OPENAI_MODEL          | Your configured model                                                         |
| OPENAI_API_KEY        | Your provider secret                                                          |

Do not upload `.env`, put secrets in build arguments, or prefix secrets with `VITE_`.
Do not copy Windows NODE_EXTRA_CA_CERTS paths: the launcher writes SUPABASE_CA_CERT
to `/tmp` and starts Node with the Linux certificate path. TLS verification stays enabled.
Set TRUST_PROXY only after verifying the trusted proxy chain in the deployed environment;
do not blindly enable trust for arbitrary forwarding headers.

## Deploy using the CLI

Run from the repository root:

```powershell
npx vercel@latest login
npx vercel@latest link
```

Configure the environment variables above, then create a preview:

```powershell
npx vercel@latest deploy
```

Vercel deployment and branch URLs are accepted from VERCEL_URL and VERCEL_BRANCH_URL.
Enable automatic system environment variables so these are supplied at runtime.
Set APP_ORIGIN to your production/custom HTTPS origin; do not disable origin checking.

After preview verification, deploy production explicitly:

```powershell
npx vercel@latest deploy --prod
```

## Checks before production

- Confirm database connectivity and existing schema. Startup does not run migrations.
- Verify login/logout, secure cookies, saving a deck, notes and course links.
- Test text upload, image-based PDF OCR and AI generation through the deployed URL.
- OCR cache lives in ephemeral `/tmp`; it may be downloaded again after scale-down.
- An API cold start can still occur after inactivity, particularly on previews.
  Read-only route data is kept briefly in memory for the signed-in account so returning
  to a page can show its last data while refreshing. Writes and account changes clear
  it. Review queues always load fresh, and no private response is cached by the CDN.
- Container Functions still have platform payload, memory and duration limits.
  The application's 20 MB file allowance is not a guarantee that Vercel accepts it:
  base64 JSON increases request size. Large uploads may require direct object-storage
  upload and a separate processing workflow before this can replace the Docker host.
- Rate limits held in process memory are per instance, not shared across autoscaled instances.
- Review function logs, resource limits and costs before enabling production traffic.

Preparing these files does not deploy the app or prove Vercel runtime compatibility.

References:

- https://vercel.com/docs/functions/container-images
- https://vercel.com/docs/services
- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/deployments/vercel-ignore
- https://vercel.com/docs/projects/deploy-from-cli
