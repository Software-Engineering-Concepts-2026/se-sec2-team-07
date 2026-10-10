# Application tests

Run `npm test`, `npm run test:integration`, `npm run build`, then `npm run test:e2e`.
See [development guide](../development.md) for a dedicated PostgreSQL test database and browser setup.

Tests cover authentication/JWT expiry/revocation, owner isolation, deck transaction rollback, SRS scheduling, concurrent/idempotent review submission, statistics, document parsing, mocked AI responses, SQLite import, and complete React workflows on desktop/mobile.

Cloud hosting, live AI generation, Docker image execution and NFR load/availability targets are not implied by a passing functional test suite.
