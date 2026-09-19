# Project development workflow

Follow the user-adopted workflow in [docs/agents.md](docs/agents.md), preserved from the supplied `setup.md` on 2026-09-19. Read it before starting a development task. Preserve the existing project charter and course documentation.

## Roles and execution

- Assign one accountable task owner. Inspect the current issue, acceptance criteria, affected files, and architecture records before editing.
- Use only the roles needed: Project Manager/System Architect, UI/UX, Frontend, Backend/Database, QA, and DevOps/Documentation. Six roles do not require six simultaneous agents.
- Delegate concrete independent tasks when useful and supported by the session. Declare file ownership and API contracts before parallel implementation. Respect the actual concurrency limit; run additional roles in stages.
- When selecting a subagent model, use these assignments: PM/Architect and Backend/Database: `gpt-6-astra` with `medium`; UI/UX, Frontend, and QA: `gpt-5.6-sol` with `medium`; routine DevOps/Documentation: `gpt-5.6-terra` with `low`, increasing to `medium` for infrastructure/CI/CD work. Optional routine worker: `gpt-5.6-luna` with `low` and specialist review.
- “Light” in the source means `low` for tools that expose that effort value. Do not claim an unavailable model was used or that the current session's model was changed. Use available capabilities and report material assignment limitations.
- Agent assignments do not change the application's `OPENAI_MODEL` or its provider credentials.

## Delivery

- Follow Scope → Agree → Implement → Integrate → Verify → Document → human Review.
- Keep React/Vite, Express, and PostgreSQL as the starting architecture. Record proposed stack changes in an ADR before implementation; do not expand issue scope without agreement.
- Preserve Thai UI conventions, Issue #4 draft recovery, and Issue #6 scheduling and daily accounting. Keep ownership checks, idempotency, and concurrency guarantees intact.
- Add migrations instead of modifying applied migrations. Keep secrets out of commits and logs.
- Map acceptance criteria to meaningful tests or documented manual checks. Report actual checks, outcomes, mocks versus live services, and remaining limitations.
- Make small issue-linked commits, keeping implementation and tests/documentation reviewable. Use feature branch names without `codex`, as requested by the user.
- Update relevant documentation and `AI_USAGE.md`. Do not equate implementation/test completion with human approval, merge, or deployment.
- Do not push directly to protected branches. README describes PRs into `develop`, while `docs/definition-of-done.md` describes PRs into `main`; confirm the intended base when preparing a PR until the team resolves this conflict. This does not block local implementation or commits.

## Handoff

Include the issue/objective, actual role/model/effort if known, acceptance criteria, owned files, dependencies/API contract, completed changes, verification, limitations, and next owner/action. Never invent model attribution or test results.
