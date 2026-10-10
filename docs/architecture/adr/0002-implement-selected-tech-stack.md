# ADR 0002: Implement the stack in tech_stack.md

Status: Accepted for the current implementation — 2026-09-11

## Context

The user explicitly requested `docs/architecture/tech_stack.md`. Historical ADR 0001 selected Next.js/Firebase while the Tech Stack and Mermaid C4 documents selected React/Vite, Express, PostgreSQL and JWT. An interim local implementation used Python/SQLite.

## Decision

Use `tech_stack.md` as the source of truth:

- React + Vite + plain CSS; pages, components, hooks and API client.
- Express modular monolith: authentication, decks, reviews, statistics and generation.
- PostgreSQL: parameterized queries, connection pool, transactions, SQL migrations and JSONB metadata.
- JWT in HttpOnly/SameSite cookies, 30-minute inactivity expiry and token-version revocation.
- OpenAI Responses REST API; optional local/manual creation without a key.
- Multi-stage Docker build and non-root Node runtime; PostgreSQL via Compose or hosted database on Render/Railway.

Modules with business algorithms separate services from SQL repositories and HTTP controllers. Deck CRUD keeps transaction orchestration in its repository because it has no separate business algorithm.

## Consequences

Frontend and backend now share JavaScript. PostgreSQL must run alongside the app. The optional development helper starts isolated real PostgreSQL, not an alternative database engine. A read-only SQLite import preserves user data and password hashes; users sign in again.

Earlier Sprint 1 prototypes are preserved. Historical PNG diagrams remain historical references. Current implementation uses the Mermaid C4 documents and this ADR. External object storage shown in planning diagrams is not implemented yet; uploaded files are extracted in memory.

This ADR supersedes the Next.js/Firebase/Vercel decision in `0001-tech-stack-selection.md` for the active application. It does not imply cloud deployment or the availability of real AI credentials.
