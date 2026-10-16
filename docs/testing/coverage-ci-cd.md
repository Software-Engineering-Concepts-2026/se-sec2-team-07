# Application coverage and automatic deployment

Verified locally on 2026-10-11 with Node 24.12.0 and the dedicated local
`focus_test` PostgreSQL database. No cloud learning data was changed.

## Coverage evidence

`npm run test:coverage` passed all 192 application tests:

- 63 Node unit tests.
- 37 integration tests against real PostgreSQL.
- 92 browser tests covering desktop and mobile workflows.

| Scope | Files | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| Entire application | 78 | 90.06% | 88.79% | 87.52% | 87.82% |
| Backend | 39 | 89.72% | 89.72% | 92.23% | 91.65% |
| React frontend | 39 | 90.60% | 87.51% | 86.40% | 85.62% |

The required gate is 60% line coverage, checked overall and independently for
frontend/backend. These figures include all application JavaScript/JSX files
under `src/backend` and `src/frontend/src`, including untested files at zero.
Tests, dependencies, generated Prisma code, build tooling and old Python lab
exercises are outside the web application's source scope. HTML, CSS and SQL
are not executable JS/JSX coverage targets.

Node uses V8 coverage through c8. React is instrumented at original source level
only during browser coverage tests. Reload/navigation snapshots and final page
snapshots are combined with the backend report. Generated reports are ignored
by Git and published as the `application-coverage` Actions artifact:

- `coverage/index.html`: navigable report and uncovered source lines.
- `coverage/lcov.info`: tooling-compatible report.
- `coverage/coverage-summary.json`: overall and per-file metrics.
- `coverage/result.json`: overall/backend/frontend metrics and gate.
- `coverage/summary.md`: human-readable summary.

The ordinary production build is restored even after a failed coverage test.
The application source and authentication behavior are unchanged.

## Split-job verification on 2026-10-15

The separate stage commands passed locally with Node 24 and an isolated local
PostgreSQL 18 test instance (Actions uses PostgreSQL 17). There were 205 passing
tests: 76 unit, 37 PostgreSQL integration and 92 desktop/mobile browser tests.
ESLint, the ordinary production build and the local HTTP/database smoke check
also passed. The merged report includes all 79 current application JS/JSX files:

| Scope | Line coverage |
| --- | ---: |
| Entire application | 90.05% |
| Backend | 89.70% |
| React frontend | 90.60% |

The runner also rejected an incomplete report with missing browser stage input,
and rejected an unknown stage. Workflow parsing, shell syntax, npm script names,
dependency gates and the then-current Vercel team scope were checked locally.
No live deployment or promotion was performed in that verification. Deployment
has since moved to Vercel Git integration as described below.

## Git deployment configuration verified on 2026-10-16

YAML/JSON parsing, ESLint and shell syntax checks passed. Comparison against
the previous workflow confirmed that all six CI jobs and their triggers are
unchanged; only the deploy job was removed. Branch-rule checks enable `main`
and disable `develop`, simple and nested feature/fix branches. Runtime services,
rewrites, regions and headers are unchanged. This configuration change did not
rerun the application suites or perform a live deployment; Vercel connection
and GitHub Branch Protection must be configured separately.

## CI/CD behavior

The Application checks workflow tests pushes and pull requests using separate jobs:

| Required check | Actual project scope |
| --- | --- |
| `lint` | ESLint checks for application/tooling JavaScript and React JSX |
| `Unit tests (Node.js)` | All Node unit tests, including the statistics module |
| `Integration tests (PostgreSQL)` | Real PostgreSQL, Prisma migrations and HTTP APIs |
| `Build & smoke-test stack` | Ordinary production build, served HTML/assets, local database health and API protection |
| `E2E tests (browser)` | Desktop/mobile Playwright tests with frontend/backend coverage collection |
| `Coverage` | Merge the three successful suites and enforce the existing 60% gates |

Database jobs each use their own temporary PostgreSQL service, with no production
database secrets. Unit tests do not require a database or browser. The three suites
upload stage-specific V8 data and completion markers; the coverage job downloads
them and refuses a missing or incomplete suite. Test, lint, build/smoke failures or
coverage below 60% must block merging through main's required status checks.
No test suite is rerun just to produce coverage.

Local equivalents (database commands require an isolated local `TEST_DATABASE_URL`):

```sh
npm run lint
npm run test:coverage:unit
npm run test:coverage:integration
npm run build
npm run test:smoke
npm run test:coverage:browser
npm run test:coverage:report
```

`npm run test:coverage` still runs all three suites and the report sequentially.
Browser collection always restores the ordinary, uninstrumented production build.
The local smoke check starts Express on a temporary loopback port and validates
the built application against the test database without creating user accounts.

Select the six real check names above in main's Branch Protection after the new
workflow runs. Replace the old required `test` check if it was configured. Do not
require `Deploy and verify Vercel`: this job has been removed. Branch Protection
settings must be saved in GitHub; changing YAML does not configure them.

The existing Vercel `focus-flashcards` project must be connected to this GitHub
repository with Production Branch `main`. GitHub Actions runs only CI; it no
longer installs Vercel CLI, deploys, promotes or uses `VERCEL_TOKEN`.
`vercel.json` disables all Git branch deployments with `**: false` and enables
only `main: true`. `develop`, feature branches and PRs run CI without Git
deployments once they contain this configuration. Manual CLI deployment is
still available when an explicit Preview is needed.

After an approved PR with passing required checks is merged into `main`, Vercel
builds and publishes Production using its existing environment variables.
Vercel reacts to main pushes independently of Actions, so Branch Protection is
the gate before deployment; do not bypass it or push directly to main. These
code changes do not connect the Vercel project or configure GitHub protection.

The read-only live checks remain available manually:

```sh
node scripts/check-deployment.js https://focus-flashcards.vercel.app
```

The optional desktop/mobile live check uses `tests/deployment.config.js` with
an HTTPS `DEPLOYMENT_URL`. Neither live check is run automatically by CI now.
They do not create accounts or change cloud learning data.

See [Actions runs](https://github.com/Software-Engineering-Concepts-2026/se-sec2-team-07/actions/workflows/ci.yml)
for the latest CI result and downloadable coverage. Use Vercel Deployments for
the deployed commit, build result and Production URL.
Local results above are evidence for the local run; each cloud run records its
own coverage and deployment result rather than assuming the local result.

## Remaining coverage limits

Passing coverage does not imply every edge case is tested. The report includes
zero coverage for the standalone startup entry and extraction-worker process
when child-process coverage is unavailable. Some recovery actions and UI branches
remain uncovered. Real AI-provider availability and OCR model downloads are not
proved by mocked AI/worker tests. Deployment smoke tests validate a public login
flow and database access, not a new production user's complete learning session.
