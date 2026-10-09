# Vercel container deployment (preview first)

Database TLS certificate verification is disabled in Dockerfile.vercel at the
user's request (`DATABASE_SSL_VERIFY=false`). Traffic remains encrypted, but the
database server's identity is not verified. No SUPABASE_CA_CERT is required in
this mode. This affects PostgreSQL only, not HTTPS/AI requests. To restore
verification, set DATABASE_SSL_VERIFY=true in Vercel and configure the CA below.

This setup runs the frontend and API together using Vercel Container Images
(Beta). Use the repository root, not `src/frontend`, as the project root.
`Dockerfile.vercel` is detected automatically; leave build/output overrides unset.
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

Use a stable preview alias and set APP_ORIGIN to that exact origin, then redeploy.
Preview and production need their own APP_ORIGIN settings. A different preview URL
will not automatically be trusted. Do not disable origin checking to work around this.

After preview verification, deploy production explicitly:

```powershell
npx vercel@latest deploy --prod
```

## Checks before production

- Confirm database connectivity and existing schema. Startup does not run migrations.
- Verify login/logout, secure cookies, saving a deck, notes and course links.
- Test text upload, image-based PDF OCR and AI generation through the deployed URL.
- OCR cache lives in ephemeral `/tmp`; it may be downloaded again after scale-down.
- Container Functions still have platform payload, memory and duration limits.
  The application's 20 MB file allowance is not a guarantee that Vercel accepts it:
  base64 JSON increases request size. Large uploads may require direct object-storage
  upload and a separate processing workflow before this can replace the Docker host.
- Rate limits held in process memory are per instance, not shared across autoscaled instances.
- Review function logs, resource limits and costs before enabling production traffic.

Preparing these files does not deploy the app or prove Vercel runtime compatibility.

References:

- https://vercel.com/docs/functions/container-images
- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/deployments/vercel-ignore
- https://vercel.com/docs/projects/deploy-from-cli
