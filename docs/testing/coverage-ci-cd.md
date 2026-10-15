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
dependency gates and explicit Vercel team scope were checked locally. No live
deployment or promotion was performed; the next new Actions run must confirm
cloud deployment permissions and promotion.

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
coverage below 60% block deployment. No test suite is rerun just to produce coverage.

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
require `Deploy and verify Vercel` on PRs because it is a push-only job. Branch
Protection settings must be saved in GitHub; changing YAML does not configure them.

For successful pushes, the existing Vercel `focus-flashcards` project receives
the tested commit automatically. Feature branches and `develop` go to Preview.
`main` uses Production environment variables and a staged deployment; only after
live checks pass is it promoted to the Production domain.

Both Vercel CLI commands explicitly use `--scope=nattapon-aonsris-projects`.
Deploy uses the linked project IDs, while promote also needs the correct team
context rather than relying on a default user lookup. If access still fails,
check that the Actions `VERCEL_TOKEN` is valid for this team/project. Git
auto-deploy is disabled in `vercel.json`, so it does not bypass these checks.
Re-running an old Actions run uses its old workflow; validate fixes with a new
push/PR containing the updated workflow.

Live verification checks public React HTML, JavaScript/CSS assets, database
health, unauthenticated API protection and same-origin login validation. Separate
desktop/mobile browser checks exercise the deployed login UI and rejected
credentials. They do not create accounts or change cloud learning data.

See [Actions runs](https://github.com/Software-Engineering-Concepts-2026/se-sec2-team-07/actions/workflows/ci.yml)
for the latest cloud result, downloadable coverage and verified deployment URL.
Local results above are evidence for the local run; each cloud run records its
own coverage and deployment result rather than assuming the local result.

## Remaining coverage limits

Passing coverage does not imply every edge case is tested. The report includes
zero coverage for the standalone startup entry and extraction-worker process
when child-process coverage is unavailable. Some recovery actions and UI branches
remain uncovered. Real AI-provider availability and OCR model downloads are not
proved by mocked AI/worker tests. Deployment smoke tests validate a public login
flow and database access, not a new production user's complete learning session.
