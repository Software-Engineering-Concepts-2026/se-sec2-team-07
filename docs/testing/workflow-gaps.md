# Workflow gap audit — 2026-10-05

This is a targeted audit, not a claim that all application behavior is covered.

## Addressed
- Explicit logout previously bypassed unsaved-change route protection. Note/card editors now register dirty refs centrally; logout asks before discarding them. Cancellation makes no logout request. A failed logout leaves the editor mounted and the draft intact.
- Successful registration/login followed by a failed profile fetch previously submitted credentials again on retry (registration could report a duplicate email). The form now retries only the profile fetch after successful authentication and disables account fields while this result is pending.

## Remaining work requiring separate implementation or verification
- Session expiry still unmounts the active editor; recovery of unsaved work across session expiry, refresh or tab closure is not implemented. Account-isolated draft recovery must also handle uncertain saves and revision conflicts.
- A lost registration POST response is distinct from a failed subsequent profile fetch and is not made idempotent by this change.
- Scanned PDFs/OCR and legacy PPT are unsupported; original document constraints still apply.
- AI content accuracy on real course PDFs/slides, quota failures, real-device behavior and high-load extraction need live verification. Mock AI tests do not establish content quality.
- Pomodoro remains a fixed 25/5 timer without persistent session history or cross-refresh recovery.

Tests for this change use isolated local PostgreSQL; no Supabase schema/data migration is needed. Keep existing AI_USAGE.md user edits excluded.

Validation: production build passed; 12/12 Chrome desktop/mobile cases passed (account recovery, cancelled/failed/confirmed logout, main app journey, note/deck routing and Pomodoro session behavior). Real Supabase sessions and physical phones were not tested in this pass.
