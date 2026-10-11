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

## CI/CD behavior

The Application checks workflow tests pushes and pull requests using a temporary
PostgreSQL service, with no production database secrets. Test failures or coverage
below 60% block the dependent deployment job.

For successful pushes, the existing Vercel `focus-flashcards` project receives
the tested commit automatically. Feature branches and `develop` go to Preview.
`main` uses Production environment variables and a staged deployment; only after
live checks pass is it promoted to the Production domain.

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
