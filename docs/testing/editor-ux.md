# Card creation UX — 2026-10-04

- Separated text, file and manual entry choices; switching preserves source text and card drafts.
- Kept generation method/count visible; moved AI level/language and optional deck metadata into expandable sections.
- Clarified review and save sections, added card count, and disabled generation until source text is sufficient.
- Added a keyboard-focusable upload input, responsive layout and visible source selection.

Validation: production build passed; 8 Playwright scenarios passed across desktop (1440px) and mobile (390px), covering app flow and Issues #3, #4 and #8. Inspected screenshots at both widths and checked horizontal overflow. Tests used guarded local PostgreSQL, real extraction/persistence, and simulated AI responses. Live AI/Supabase browser flows were not repeated for this UI change. No database or AI integration code changed.
