# ADR 0011: Short-lived account-scoped read cache in browser memory

Status: Implemented; recorded 2026-10-10. Describes the current route-loading strategy, not a new runtime change.

## Context

Repeated navigation waited for private data the account had just loaded. Faster navigation must not expose another user's data, overwrite drafts or review stale queues.

## Decision

- Cache eligible read snapshots only in browser memory for the current account; no localStorage or IndexedDB persistence.
- Limit snapshots to 60 seconds, 32 resources, 8 MB total and 2 MB per resource. Evict expired/least-recently-used entries.
- Show a known snapshot while validating with the server. Copy values so drafts cannot mutate cached snapshots.
- Invalidate after successful writes. Login, logout, account changes and 401 responses end the previous cache session.
- Check session/mutation generations so an old response cannot restore data after an account change or successful write.
- Never cache authentication checks or SRS review queues; due dates and daily budgets must remain authoritative.
- Protect dirty drafts and uncertain saves from background replacement. Keep explicit reload and recovery behavior.
- Combine overview reads and parallelize independent queries where consistency requirements permit it.

## Consequences

Revisits can show useful data sooner. First visits, refreshes and expired snapshots still require the network; this is not offline support or a guarantee against cold starts.
Displayed data may be briefly older than server data. Private API responses stay outside CDN caches.

## Alternatives considered

- Public CDN caching of private data: rejected because users' records must stay isolated.
- Persist snapshots across logins: rejected because old account data must not enter a new session.
- Cache review queues like ordinary lists: rejected because stale queues can ignore current due dates or time remaining.

## References

- [Cache implementation](../../../src/frontend/src/hooks/readCache.js)
- [Synchronization](../../../src/frontend/src/hooks/useRemoteSync.js)
- [Regression tests](../../../tests/e2e/read-cache.spec.js)
- [Performance verification](../../testing/loading-performance.md)
