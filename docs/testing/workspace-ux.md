# Website UX refresh — 2026-10-04

## Changes
- Shared readable typography, consistent buttons, fields, cards, empty states, alerts and tables across all routes.
- Mobile navigation displays all ten destinations in two rows, with space reserved below content and safe-area support.
- Compact sync status with expandable explanatory text.
- Password visibility control with an explicit accessible input name; library result count and clear-filter actions.
- Scrollable 30-day statistics history with sticky headings and keyboard focus.

## Validation and limits
- Production build passed.
- Full Chrome Playwright suite: 52/52 passed on desktop (1440x1000) and mobile emulation (390x844).
- Captured all ten main destinations and authentication at both sizes; inspected representative dashboard, editor, notes, statistics, library, courses, schedule, Pomodoro, export and authentication screenshots.
- Navigation smoke test checks every main route for horizontal overflow and JavaScript errors, password visibility and filter clearing.
- Tests use guarded local PostgreSQL and mocked AI where applicable. No live Supabase data was mutated. Real phone/Safari/Firefox and live AI flows were not tested in this refresh.
- No backend, schema, AI provider configuration or user AI_USAGE.md changes.
