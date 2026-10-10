# Loading performance — 2026-10-05

## Changes and measured build output
- Page modules now load on demand; navigation and the running Pomodoro provider remain mounted behind a content-only loading boundary.
- Main JavaScript: 432.21 kB to 350.66 kB (18.9% smaller, uncompressed). Vite gzip estimate: 130.16 kB to 111.68 kB (14.2% smaller). CSS unchanged at 42.58 kB. Route/shared chunks are fetched separately when needed; these are not total application-size reductions.
- Library initial load, manual refresh and background polling request decks only, removing the previously unused statistics request. Dashboard and statistics still request the data they need.

## Verification limits
- Build sizes are evidence of reduced initial payload, not a measured reduction in seconds or a live Supabase latency benchmark.
- No persistent account-data cache was added; existing fresh-data and draft-conflict protection remain in place. First visits to another page need its route chunk.
- No changes to authentication cookies, database, migrations, AI providers or AI_USAGE.md.

## Validation
- Production build passed. Chrome desktop/mobile run: 19/20 passed, including the no-statistics library regression and navigation through all main routes.
- One desktop note-sync case timed out waiting for the second saved note to appear. The same case passed three consecutive isolated reruns. Cause is not established; retain this intermittent failure as a follow-up rather than claiming the complete run was green.
- Browser tests used isolated local PostgreSQL, not the live Supabase database.
