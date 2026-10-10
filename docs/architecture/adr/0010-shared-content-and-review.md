# ADR 0010: Shared originals, one review history and explicit archive state

Status: Implemented; recorded 2026-10-10. Describes the current course and review model, not a new runtime change.

## Context

Users reuse cards and notes across courses. Copying content would create diverging edits and duplicate review history.
Study time is limited, and completed cards must leave the queue without losing their history.

## Decision

- Courses link the owner's existing cards and notes instead of copying them. Linking a deck skips existing links.
- Course filtering changes the selected cards, not their identity, SRS schedule or history.
- Editing shared content changes the original and every linked course. The UI requests confirmation and supports dialog editing on the course page.
- Removing a link or deleting a course preserves originals. Linked originals cannot be deleted until their links are removed.
- Store a review and scheduling changes atomically. Retry identifiers and locks prevent duplicate accounting and double spending of the daily allowance.
- Build a bounded queue from SRS due dates and daily time remaining. Selecting a course/deck does not bring future cards forward.
- Archive only on an explicit user action. Keep identity, links and history, but exclude archived cards from active queues and forecasts.
- Use Bangkok day boundaries for statistics. Attempts and unique cards differ; accuracy measures `good`/`easy` attempts, not exam scores.

## Consequences

Edits propagate consistently, but users must understand the effect on every linked course.
Archived cards return without duplication. Empty queues can mean nothing is due or the remaining budget cannot fit another card.
Concurrency-sensitive operations retain SQL transactions alongside Prisma, as recorded in [ADR 0008](008-prisma-supabase.md).

## Alternatives considered

- Duplicate cards per course: rejected because originals and schedules drift apart.
- Delete completed cards: rejected because identity and history must remain recoverable.
- Ignore due dates/budget: rejected because forecasts and daily accounting must stay consistent.

## References

- [Course implementation](../../../src/backend/modules/courses)
- [Review implementation](../../../src/backend/modules/reviews)
- [Archive verification](../../testing/issue-16.md)
- [Concurrency verification](../../testing/issue-10.md)
- [User guide](../../user_guide.md)
