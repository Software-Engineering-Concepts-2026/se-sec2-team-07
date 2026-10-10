# Tech Stack migration verification — 2026-09-11

## Results

| Check | Result |
| --- | --- |
| Node service/unit tests | 6 passed |
| Real PostgreSQL integration tests | 7 passed |
| Chrome complete workflow, desktop 1440×1000 | Passed |
| Chrome complete workflow, mobile 390×844 | Passed |
| Vite production build | Passed |
| Docker Compose configuration validation | Passed |
| Git whitespace check | Passed |

The browser workflows cover registration, upload of a text document, local card generation, editing and saving, persistence after reload, unsaved-change cancellation, timer pause/resume, two card reviews, real statistics, deck deletion, logout and login. No uncaught page errors were observed; dashboard layout did not overflow either viewport horizontally.

Database tests cover user isolation, JWT expiration and revocation, rollback on invalid deck edits, preservation of card schedules, concurrent idempotent review submissions, conflicting review rejection, cascade deletion, CSRF/content-type validation, and read-only SQLite migration with destination collision protection.

## Environment and limits

Validation used Node.js 24, Chrome, and an isolated real PostgreSQL 18.4 cluster under `.local/postgres`. Compose/CI target PostgreSQL 17. No existing system PostgreSQL database was modified. The original `data/focus.sqlite3` was empty (0 users/decks/cards/reviews); its read-only import completed without modifying the source. Nonempty migration behavior was verified with synthetic fixtures in a dedicated test schema.

Docker Engine was unavailable, so the image was not built or started. No real OpenAI key/model was configured: AI request/response behavior was tested with mocked transport only. No cloud deployment or NFR performance/availability certification was performed.

Run commands and setup are in [development.md](../development.md).
