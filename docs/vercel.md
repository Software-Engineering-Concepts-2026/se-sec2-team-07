# Vercel Node.js deployment (preview first)

`vercel.json` places the Express/Node.js function in Singapore (`sin1`), next to this
project's Supabase pooler in `ap-southeast-1`. If the database region changes,
update this setting. The exported app in `src/backend/vercel.js` creates one pool
per warm instance and does not bind a port, check the schema or run migrations at
startup. HTML and assets are served independently by the CDN. `/api/health`
still checks the database, and authenticated APIs still verify users against it.
Ordinary Docker/local startup checks remain enabled. See [ADR 0010](architecture/adr/0010-vercel-node-api.md).

The Node.js entry preserves the user's database TLS certificate opt-out by
default (`DATABASE_SSL_VERIFY=false`), previously supplied by Dockerfile.vercel.
Traffic remains encrypted, but the
database server's identity is not verified. No SUPABASE_CA_CERT is required in
this mode. This affects PostgreSQL only, not HTTPS/AI requests. To restore
verification, configure a trusted CA for the database driver and explicitly set
DATABASE_SSL_VERIFY=true. The Node.js entry does not run the Docker CA launcher.

This setup uses Vercel Services (Beta) in one project and on one domain.
The `web` service builds Vite to `dist` and serves HTML, JavaScript, fonts and images
from the CDN. The `api` service uses the `express` framework and exports the existing
application from `src/backend/vercel.js`; only `/api` requests reach that function.
Static page files do not wait for an API cold start.
Use the repository root, not `src/frontend`, as the project root.
Service build/output settings are in `vercel.json`; leave dashboard overrides unset.
The existing Dockerfile and Docker Hub release are independent.

## Project settings

Set these in Vercel Settings → Environment Variables for the appropriate environment:

| Variable              | Value                                                                          |
| --------------------- | ------------------------------------------------------------------------------ |
| PORT                  | Not required for the exported Node.js app; `8000` only for the Docker fallback |
| NODE_ENV              | `production`                                                                   |
| HOST                  | Not required for the exported Node.js app; `0.0.0.0` for Docker                |
| COOKIE_SECURE         | `true`                                                                         |
| APP_ORIGIN            | Exact HTTPS origin used to open this deployment, without a trailing slash      |
| SUPABASE_PROJECT_REF  | Your existing database project reference                                       |
| SUPABASE_DATABASE_URL | Verified Supabase connection URL; use a separate database for preview testing  |
| JWT_SECRET            | A strong random secret of at least 32 characters                               |
| DATABASE_SSL_VERIFY   | `false` in the selected certificate opt-out mode                               |
| OPENAI_BASE_URL       | Your AI provider's HTTPS endpoint                                              |
| OPENAI_API_MODE       | `chat` or `responses`, as configured for your provider                         |
| OPENAI_MODEL          | `gpt-5.4-mini` for the current KKU configuration                               |
| OPENAI_API_KEY        | Your provider secret                                                           |

Do not upload `.env`, put secrets in build arguments, or prefix secrets with `VITE_`.
Do not copy Windows NODE_EXTRA_CA_CERTS paths into Vercel.
In the current DATABASE_SSL_VERIFY=false mode, this certificate is not loaded;
PostgreSQL encryption remains enabled but server identity verification is disabled.
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

If the CLI reports Not authorized, check the account with `npx vercel@latest whoami`
and select the team that owns the existing project. For this project's current team:

```powershell
npx vercel@latest deploy --scope nattapon-aonsris-projects
```

Use the correct team slug for another account; do not create a new project to work around missing permissions.

Vercel deployment and branch URLs are accepted from VERCEL_URL and VERCEL_BRANCH_URL.
Production also accepts the project's exact vercel.app domain from VERCEL_PROJECT_PRODUCTION_URL
when VERCEL_ENV=production. This stable domain differs from the generated deployment URL.
Enable access to system environment variables so these are supplied at runtime.
Set APP_ORIGIN in the Production environment to the HTTPS origin your visitors use
(for example, https://focus-flashcards.vercel.app). Custom domains require APP_ORIGIN.
Do not disable origin checking or trust arbitrary forwarded hosts.

After preview verification, deploy production explicitly:

```powershell
npx vercel@latest deploy --prod
```

For the current team, the explicit command is `npx vercel@latest deploy --prod --scope nattapon-aonsris-projects`.
Deploying a Preview alone does not update the Production domain. After deploying, verify
`/api/health`, then registration/login through the Production URL. A rejected Origin
requires checking APP_ORIGIN/system variables and redeploying; do not disable the policy.

## Automatic deployment through Vercel Git integration

GitHub Actions runs the six checks listed in
[the workflow guide](../.github/workflows/readme.md), including the 60% line
coverage gates for the whole application, frontend and backend. Actions does
not deploy or promote, and does not need a `VERCEL_TOKEN` secret.

Connect the existing project rather than creating a second one:

1. Open Vercel → `focus-flashcards` → Settings → Git.
2. Connect `Software-Engineering-Concepts-2026/se-sec2-team-07`.
3. Set Production Branch to `main` and use the repository root as Root Directory.
4. Keep the existing Production environment variables in Vercel. Leave build/output
   overrides unset so the Services settings in `vercel.json` apply.
5. Configure GitHub Branch Protection to require a PR, at least one approval,
   all six CI checks and an up-to-date branch before merging into main.

`git.deploymentEnabled` in `vercel.json` sets `**: false` and `main: true`.
Vercel deploys Git pushes to main only; develop, feature branches and PRs run
CI without automatic Preview deployments once they include this configuration.
Explicit manual Preview deployment through the CLI remains available.

After the reviewed PR is merged, Vercel builds the Vite/Express services and
publishes Production. Vercel starts on the main push independently of Actions;
required PR checks are the gate before merge. Do not bypass protection or push
directly to main. The coverage artifact remains available in Actions, while
deployment logs and URLs are shown in Vercel.

Live verification is manual in this setup. Run
`node scripts/check-deployment.js https://focus-flashcards.vercel.app` to check
React HTML, assets, database health, protected APIs and login Origin validation.
The desktop/mobile login checks in `tests/deployment.config.js` can also be run
manually with an HTTPS `DEPLOYMENT_URL`. They do not create cloud accounts or
change learning data. The ordinary build/smoke and browser CI checks still run
against an isolated local test database before merge.

## Checks before production

- Confirm database connectivity and existing schema. Startup does not run migrations.
- Verify login/logout, secure cookies, saving a deck, notes and course links.
- Test text upload, image-based PDF OCR and AI generation through the deployed URL.
- OCR cache lives in ephemeral `/tmp`; it may be downloaded again after scale-down.
- An API cold start can still occur after inactivity, particularly on previews.
  Read-only route data is kept briefly in memory for the signed-in account so returning
  to a page can show its last data while refreshing. Writes and account changes clear
  it. Review queues always load fresh, and no private response is cached by the CDN.
- Node.js Functions still have platform payload, memory and duration limits.
  The application's 20 MB file allowance is not a guarantee that Vercel accepts it:
  base64 JSON increases request size. Large uploads may require direct object-storage
  upload and a separate processing workflow before this can replace the Docker host.
- Rate limits held in process memory are per instance, not shared across autoscaled instances.
- Review function logs, resource limits and costs before enabling production traffic.

Documentation changes alone do not update Production. With the Git integration
configured, merging into main triggers the production build and deployment.

## Worker packaging and Docker fallback

Document extraction retains its isolated child process. `require.resolve` makes
the worker import graph traceable, and the API service's `includeFiles` also
includes native canvas, PDF assets and OCR worker/WASM files. These dependencies
must be in the deployment even though the main API does not load them at startup.
On Vercel the OCR worker uses `/tmp/focus-flashcards/ocr`; local/Docker cache paths
remain unchanged. Test TXT, MD, PPTX, text PDFs and scanned PDFs on the deployed URL.

`Dockerfile`, Compose and the Docker Hub release remain available. To switch the
Vercel API back to its previous container, set the `api` service to
`{ "root": ".", "runtime": "container", "entrypoint": "Dockerfile.vercel" }`,
then deploy a Preview and verify it. The public rewrites and web service stay the same.

References:

- https://vercel.com/docs/frameworks/backend/express
- https://vercel.com/docs/services
- https://vercel.com/docs/functions/limitations
- https://vercel.com/docs/deployments/vercel-ignore
- https://vercel.com/docs/projects/deploy-from-cli
- https://vercel.com/docs/cli/deploy
- https://vercel.com/docs/git/vercel-for-github
- https://vercel.com/docs/project-configuration/git-configuration
