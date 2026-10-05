# Reference visual refresh

Based on the supplied 15-page Focus Flashcards design PDF: violet canvas,
dark grouped navigation, yellow primary actions, mint highlights and bordered
cards with offset shadows. The shared theme covers all current routes.

Dashboard uses live due counts, review counts, streak and weekly activity.
Mission completion is derived from saved decks and review statistics. The third
metric shows actual review count rather than a fabricated daily time value.
Mobile keeps four primary routes plus an expandable More menu. The prior
request to hide routine sync status remains respected; no fake saved timestamp
is displayed. Existing forms, data validation, OCR review and difficulty labels
remain available. This is a responsive adaptation, not a pixel-identical static
copy: real data and existing features may add content beyond the reference.

Validation: production build; desktop/mobile route smoke and overflow checks,
menu expansion/navigation, review-card flip, card creation/OCR confirmation,
and document/note persistence tests against the isolated local test database.
Screenshots inspected for desktop and mobile. Production Supabase and live AI
were not used. No changes to database schema or authentication behavior.
