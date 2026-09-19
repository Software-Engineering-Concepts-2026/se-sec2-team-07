# Focus Flash Card

A study web application by **NEX4**, developed in the `se-sec2-team-07` university software engineering repository. Focus Flash Card helps students turn study materials into editable flashcards, review them with spaced repetition, and plan revision around the time they have available.

This README describes the current application and a proposed six-agent development workflow tailored to its existing codebase. The repository also uses the name **Focus Flashcards** and the package name `focus-flashcards`.

## Project Overview

The current codebase includes:

- Account registration and sign-in using JWT authentication in HttpOnly cookies.
- Personal decks and cards with questions and answers.
- Text extraction from PDF, PPTX, TXT, and Markdown documents.
- Manual card creation, local text-based generation, and optional AI generation.
- A card editor with validation, deletion recovery, and retry handling when saving fails.
- Spaced repetition using `again`, `hard`, `good`, and `easy` responses.
- A daily review budget of **1–120 minutes**, with a default of **10 minutes**.
- A seven-day review plan, a review timer, and learning statistics.

The daily budget is shared across a user's decks and review sessions. Daily accounting uses **Asia/Bangkok**. The plan forecasts each card's next review; it does not predict future answers or provide calendar integration and notifications.

Implementation and test documentation already exists for **Issue #4** (card review and editing) and **Issue #6** (review planning). Future work should extend these features and protect their existing behaviour. The presence of code and test reports does not establish that an issue has been merged or released.

## Current Technology Stack

| Area | Existing implementation |
| --- | --- |
| Frontend | React, Vite, React Router, JavaScript/JSX, plain CSS |
| Backend | Node.js and Express |
| Database | PostgreSQL with versioned SQL migrations |
| Authentication | JWT in HttpOnly cookies; server-side password hashing |
| Validation | Zod and server-side business rules |
| Optional card generation | Server-side OpenAI integration |
| Testing | Node.js test runner, Supertest, Playwright |
| Local development and delivery | npm scripts, Docker Compose, Dockerfile, GitHub Actions |

Use the current architecture as the starting point. Record proposed stack changes in an architectural decision record before implementation.

## Six-Agent Development Team

These are the project's selected model assignments and suggested effort defaults, not benchmark rankings. **Light** and **Medium** describe the team's preferred effort levels; they are not literal API parameter names.

| Agent | Model | Default effort | Focus Flash Card responsibility |
| --- | --- | --- | --- |
| Project Manager / System Architect | GPT-6 Astra | Medium | Break issues into tasks, align acceptance criteria, coordinate dependencies, and protect architecture. |
| UI/UX Designer | GPT-5.6 Sol | Medium | Design the upload-to-review journey, editor states, review interactions, schedule, and statistics. |
| Frontend Developer | GPT-5.6 Sol | Medium | Implement React pages, shared components, API integration, timers, and draft recovery. |
| Backend & Database Developer | GPT-6 Astra | Medium | Own authentication, deck ownership, extraction/generation, review scheduling, transactions, and migrations. |
| QA / Tester | GPT-5.6 Sol | Medium | Verify acceptance criteria, regression behaviour, data isolation, and desktop/mobile flows. |
| DevOps & Documentation | GPT-5.6 Terra | Light | Maintain setup instructions, development documentation, test evidence, and routine configuration. |
| Optional routine worker | GPT-5.6 Luna | Light | Handle small formatting changes, boilerplate, log summaries, and repetitive edits with specialist review. |

Use **Light** for a clearly specified local change, such as a label correction or documentation update. Use **Medium** for connected decisions, debugging, API changes, database changes, or test design. DevOps should switch to Medium for CI/CD changes, deployment failures, and infrastructure work.

These development-agent models are separate from the application's `OPENAI_MODEL` setting. Changing an agent assignment does not configure the model used to generate users' flashcards.

### 1. Project Manager / System Architect

- Read the issue, requirements, architecture records, and affected implementation before planning.
- Split work into independently reviewable tasks with an owner, dependencies, and acceptance criteria.
- Coordinate contracts between the React client, Express modules, and PostgreSQL.
- Resolve conflicts involving daily budgets, review scheduling, ownership, and persisted data.
- Keep the scope aligned with the current issue and record unresolved decisions.

**Deliverables:** task breakdown, agreed behaviour, architecture decisions, integration plan, and delivery summary.

### 2. UI/UX Designer

- Define the journey from importing content to editing, saving, and reviewing cards.
- Specify loading, empty, validation, AI-unavailable, save-failure, and time-exhausted states.
- Make daily time settings, remaining time, and the seven-day forecast easy to understand.
- Preserve the application's Thai interface conventions unless translation is requested.
- Document keyboard access, focus behaviour, readable contrast, and mobile layouts.

**Primary areas:** `src/frontend/src/pages/`, shared components, and `style.css`.

**Deliverables:** screen and interaction specifications with acceptance criteria for all relevant states.

### 3. Frontend Developer

- Extend `Dashboard.jsx`, `Library.jsx`, `Editor.jsx`, `Review.jsx`, `Schedule.jsx`, and `Statistics.jsx` as required.
- Reuse the existing API helper, context, components, and hooks.
- Preserve unsaved drafts and edited content when requests fail.
- Keep review timers consistent with server-provided remaining time.
- Prevent accidental duplicate submissions and provide clear recovery actions.

**Deliverables:** React changes, API integration, and evidence of relevant user-flow checks.

### 4. Backend & Database Developer

- Maintain the `auth`, `decks`, `generation`, `reviews`, and `stats` modules.
- Enforce ownership checks on all user-specific data.
- Validate uploads, generated cards, review responses, and time-budget settings.
- Preserve idempotent review submissions and consistent accounting under concurrent requests.
- Add new SQL migrations rather than editing migrations that have already been applied.
- Keep provider credentials and document processing on the server.

**Deliverables:** endpoint and service changes, migrations, contract notes, and relevant unit/integration tests.

### 5. QA / Tester

- Map every acceptance criterion to a test or documented manual check.
- Protect Issue #4 behaviour: editing, deleting, restoring, retrying failed saves, and reopening saved decks.
- Protect Issue #6 behaviour: saved settings, shared daily budgets, correct scheduling, and timer expiry.
- Check account isolation, invalid input, duplicate responses, concurrency, and Bangkok date boundaries.
- Distinguish mocked AI checks from live provider verification.
- Report actual commands, outcomes, skipped checks, and remaining limitations.

**Deliverables:** test cases, reproducible defects, regression results, and a release-readiness recommendation.

### 6. DevOps & Documentation

- Maintain existing npm scripts, Docker configuration, and `.github/workflows/ci.yml`.
- Keep development, test, and production database configuration separate.
- Document environment setup, migrations, deployment, recovery, and health checks.
- Update `docs/development.md`, issue-specific test notes, and `AI_USAGE.md` when applicable.
- Preserve course documentation and the team's working agreements.

**Deliverables:** reproducible setup, delivery configuration, accurate documentation, and verification records.

## Application Architecture

```text
Browser: React / Vite
        |
        | /api requests
        v
Express application
  |-- auth
  |-- decks
  |-- generation ------> Document extraction / optional AI provider
  |-- reviews
  |-- stats
        |
        v
PostgreSQL
  users | decks | cards | reviews | review_days
```

During development, Vite serves the UI and proxies API requests to Express. After building, Express serves the frontend and API. The current runtime is the Node.js application; historical prototypes and other service folders should not be assumed to be required runtime components.

The review module handles both spaced-repetition results and daily time planning. The backend is authoritative for persisted budgets and review records; the frontend displays the plan and controls the current session.

## Agent Collaboration Workflow

1. **Scope:** The Project Manager reads the issue and records affected files, expected behaviour, and acceptance criteria.
2. **Agree:** UI/UX, Frontend, and Backend align on interactions and request/response contracts.
3. **Implement:** Developers work on assigned files; independent tasks may run in parallel when capacity permits.
4. **Integrate:** The task owner combines changes and checks the full feature path.
5. **Verify:** QA runs relevant tests and returns defects to the responsible developer.
6. **Document:** DevOps & Documentation records setup changes, test evidence, and operational implications.
7. **Review:** Human team members review the PR and merge through the agreed repository process.

Six roles do not require six simultaneous agents. One session may perform multiple roles; assign only the roles needed for the current task.

### Collaboration Rules

- One task has one accountable owner, even when several agents contribute.
- Read current files before editing and preserve unrelated work.
- Assign file ownership before concurrent edits, especially for shared CSS, API helpers, migrations, and package configuration.
- Share endpoint contracts before frontend/backend integration.
- Include changed files, tests, assumptions, and remaining work in every handoff.
- Do not expand an issue into a redesign or stack migration without an agreed scope change.
- Use small commits linked to the issue; keep implementation and test/documentation changes easy to review.
- Keep secrets out of commits and logs.
- Record material AI assistance in `AI_USAGE.md`; human review remains part of the course workflow.
- Follow the team's PR review policy; do not push directly to protected branches.

**Workflow alignment needed:** the existing project charter describes feature branches merging into `develop`, while `docs/definition-of-done.md` describes PRs into `main`. Confirm the target for each PR with the team until those documents are aligned. Both require review.

### Task Handoff Template

```text
Issue / objective:
Agent / model / effort:
Acceptance criteria:
Files owned:
Dependencies and API contract:
Changes completed:
Verification performed:
Known limitations:
Next owner / next action:
```

## Repository Structure

The following is a focused view of existing project paths:

```text
.
|-- README.md
|-- AI_USAGE.md
|-- package.json
|-- vite.config.js
|-- playwright.config.js
|-- .env.example
|-- Dockerfile
|-- compose.yaml
|-- .github/workflows/ci.yml
|-- src/
|   |-- frontend/src/
|   |   |-- pages/
|   |   |-- components/
|   |   |-- hooks/
|   |   |-- api.js
|   |   |-- context.jsx
|   |   `-- style.css
|   `-- backend/
|       |-- app.js
|       |-- server.js
|       |-- config.js
|       |-- modules/
|       |   |-- auth/
|       |   |-- decks/
|       |   |-- generation/
|       |   |-- reviews/
|       |   `-- stats/
|       |-- db/migrations/
|       `-- shared/
|-- scripts/
|-- tests/
|   |-- unit/
|   |-- integration/
|   `-- e2e/
|-- docs/
|   |-- development.md
|   |-- definition-of-done.md
|   |-- architecture/
|   |-- requirements/
|   `-- testing/
|-- prototypes/sprint1/
`-- team/
```

Suggested additions, if useful: `docs/agents.md` for reusable role instructions, `docs/api-contract.md` for shared endpoint contracts, and an issue template for bug reports. These are proposals, not files created by this README.

## Getting Started

Run the commands from the application repository root. The project declares Node.js **22.12.0 or newer**; its development guide recommends Node.js 24 LTS.

Install dependencies:

```sh
npm ci
```

For the supplied local PostgreSQL setup, start the database and leave its terminal open:

```sh
npm run db:local
```

In a second terminal:

```sh
npm run dev
```

Open **http://127.0.0.1:5173**. The local database helper creates development/test databases and creates `.env` if it is missing.

Alternatively, configure an existing PostgreSQL instance using `.env.example`. Set `DATABASE_URL`, a separate `TEST_DATABASE_URL`, and a random `JWT_SECRET`. See `docs/development.md` for the full procedure.

To run the built application:

```sh
npm run build
npm start
```

Open **http://127.0.0.1:8000**. Startup applies pending database migrations.

AI generation is optional and requires server-side `OPENAI_API_KEY` and `OPENAI_MODEL`. Manual entry and local text-based generation remain available without those settings.

## Testing and Completion

The existing scripts are:

```sh
npm test
npm run test:integration
npm run build
npm run test:e2e
```

Integration and browser tests require a separate test database. Browser tests use Chrome and exercise desktop and mobile viewports; the browser test server runs on port 8001. Follow `docs/development.md` for prerequisites.

A task is ready for team review when its acceptance criteria are satisfied, relevant checks pass, regressions are addressed, and documentation is updated. Record whether verification used mocks, a live service, or manual checks. Final completion follows the team's review and merge requirements.

This README adaptation does not claim a new application test run, live AI verification, or deployment.

## Bug Reporting Flow

1. QA reproduces the defect and records evidence.
2. The Project Manager assigns priority and an accountable developer.
3. The developer fixes the cause and adds a regression check where appropriate.
4. QA repeats the original steps and checks related editor/review flows.
5. Documentation is updated when behaviour or setup changes; the team reviews the fix.

```md
## Title
[Review] A repeated submission reduces the daily budget twice

## Environment
Commit/branch:
Browser/device:
Test account and deck:
Date/time and timezone:

## Steps to reproduce
1. Start a review session with available daily time.
2. Submit one answer.
3. Retry the same request with the same review identifier.

## Expected result
One review is recorded and its time is counted once.

## Actual result
Describe the observed behaviour; do not assume this example is a known defect.

## Evidence
Sanitised request/response, screenshot, or relevant log.

## Severity / Priority
Severity:
Priority:

## Verification after the fix
Regression check:
Result:
```

## Usage Example: Extend Daily Review Planning

**Example request:** “Improve the daily review plan while preserving Issue #6 behaviour.”

| Agent | Assigned work |
| --- | --- |
| Project Manager — Astra / Medium | Inspect Issue #6 documentation and the planner; define the requested improvement and regression boundaries. |
| UI/UX — Sol / Medium | Specify how remaining time, overdue cards, and the seven-day plan should appear. |
| Backend — Astra / Medium | Extend planning logic and contracts without breaking ownership, idempotency, or shared daily accounting. |
| Frontend — Sol / Medium | Update Schedule and Review using the agreed response fields and error states. |
| QA — Sol / Medium | Check persistence, time limits, retries, concurrency, date boundaries, and desktop/mobile behaviour. |
| DevOps & Documentation — Terra / Light | Update the issue notes and user instructions; use Medium if delivery configuration changes. |

Useful current endpoints include `GET /api/review/plan`, `PUT /api/review/plan`, `GET /api/review`, and `POST /api/review`. Read their current implementation before changing the contract.

Example starting prompt:

> Act as the Project Manager / System Architect for Focus Flash Card using GPT-6 Astra with Medium effort. Read the current requirements, architecture decisions, Issue #6 test notes, and review-planning implementation. Break the requested improvement into tasks for the relevant agents. Specify file ownership, API dependencies, acceptance criteria, and regression checks. Preserve existing editor recovery, user data isolation, and daily review accounting.

## Project Documentation and Team

Continue maintaining the repository's existing requirements, architecture decisions, testing notes, project charter, and course submissions alongside this guide.

**Team NEX4:** Parichat (`@Brielle-Chxn`), Nattapon (`@Nattaponao`), Naphatchai (`@Nightnay2`), and Waritsara (`@SrLiliumBulby`).

The agents support the team; the team owns product decisions, review, and submission.
