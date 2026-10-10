# ADR 0002: React/Vite, Express and custom JWT authentication

Status: Accepted for frontend, backend and authentication — 2026-09-11.
Reviewed: 2026-10-10. Database and deployment details are refined by ADR 0008 and ADR 0009.

## Context

The original [ADR 0001](0001-tech-stack-selection.md) proposed Next.js/Firebase. The selected stack instead uses React/Vite, Express, PostgreSQL and JWT for editable card drafts, SRS review, extraction and a shared JavaScript runtime. An interim Python/SQLite web implementation is not the current runtime.

## Decision

Use [tech_stack.md](../tech_stack.md) as the current stack summary:

- React + Vite + plain CSS, with hash routing; no Next.js server-side rendering.
- Express [modular monolith](0003-modular-monolith.md): authentication, decks, reviews, statistics, courses, notes, documents and generation.
- Supabase PostgreSQL with Prisma/pg and explicit migrations, as specified in [ADR 0008](008-prisma-supabase.md).
- Custom JWT in HttpOnly/SameSite cookies, 30-minute inactivity expiry and token-version revocation. No Firebase/Supabase Auth login; API operations retain owner checks.
- Configurable OpenAI-compatible HTTPS providers using Responses or Chat Completions mode. Gemini-specific integration is not implemented. AI keys stay on the server.
- Manual entry and deterministic text splitting work without AI credentials. AI output is a draft that the user reviews before saving.
- Isolated file extraction workers and PDF OCR fallback, with [limits and review requirements](../../pdf-ocr.md).
- Multi-stage Docker build and non-root Node runtime; the current Vercel CDN/container deployment is recorded in [ADR 0009](0009-vercel-services.md).

Modules with business algorithms separate services from SQL repositories and HTTP controllers. Deck CRUD keeps transaction orchestration in its repository because it has no separate business algorithm.

## Consequences

Frontend and backend share JavaScript/JSON contracts. Authenticated features require the API and database even when static pages are available. A cookie alone does not establish resource ownership.

Application runtime selects Supabase; local PostgreSQL is reserved for isolated tests. The former Compose database and Render/Railway proposals are not the current configuration. Historical Python exercises are course-lab material, not a second web backend.

Reading a file into a card/note draft does not save its original. The separate document library stores original bytes and extracted text in PostgreSQL, protected by owner checks. External object storage shown in planning diagrams remains a possible extension.

Courses share originals and one review history ([ADR 0010](0010-shared-content-and-review.md)). Recent read snapshots stay in account-scoped browser memory ([ADR 0011](0011-private-read-cache.md)); this is not offline persistence. Unsaved drafts require an explicit save.

## Alternatives considered

- Next.js/Firebase: preserved in ADR 0001, superseded by the React/Express selection.
- Python/SQLite web runtime: not retained; application runtime and migrations use PostgreSQL.
- Mandatory AI creation: rejected because users need manual/local workflows during provider outages or without credentials.

## References

- [Architecture index](../README.md)
- [Development guide](../../development.md)
- [User guide](../../user_guide.md)
