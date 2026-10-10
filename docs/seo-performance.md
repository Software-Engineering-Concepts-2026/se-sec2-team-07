# SEO and loading performance

## Changes

- Serve production static files with compression. Hashed `/assets` files use a one-year immutable cache; HTML revalidates so deployments pick up new asset names.
- Keep private API responses `no-store` and add `X-Robots-Tag: noindex, nofollow`.
- Load the authenticated layout and Pomodoro module on demand. Existing page chunks remain lazy-loaded.
- Preload the Thai and Latin fonts used on the first screen. Fonts remain self-hosted.
- Add Thai description, Open Graph metadata, robots.txt and a JavaScript-disabled explanation. Authenticated screens set noindex metadata.

## Local measurement (2026-10-06)

Lighthouse mobile defaults, production build served by Express at `http://127.0.0.1:8001`, headless Chrome. One run before and one after; these are not deployed-site scores.

| Metric | Before | After |
| --- | --- | --- |
| Performance | 82 | 98 |
| SEO | 90 | 100 |
| Accessibility | 100 | 100 |
| Best practices | 96 | 96 |
| First contentful paint | 3.4 s | 1.6 s |
| Largest contentful paint | 3.7 s | 2.2 s |
| Transferred data | 491 KiB | 204 KiB |
| Layout shift | 0.001 | 0 |

Reports are local, ignored files: `.local/lighthouse-before.json` and `.local/lighthouse-after.json`.

To repeat, build the app and run the production server, then run:

```powershell
npx lighthouse http://127.0.0.1:8001 --chrome-flags="--headless" --only-categories=performance,seo,accessibility,best-practices --output=json --output-path=.local/lighthouse-after.json --quiet
```

Use the actual server port. Development mode does not represent production compression, caching or bundle sizes.

## Verification and limits

- Build passed. Six browser checks passed across desktop and mobile: reference-design navigation, card creation/upload error recovery and Pomodoro controls/navigation/session reset. Tests use the isolated test database.
- HTTP checks verified HTML revalidation, gzip for JS/CSS, immutable asset caching, font preload URLs and private API headers.
- Best-practices score still includes the expected anonymous `/api/me` 401 in the console.
- Lighthouse measured the public login screen, not every authenticated route. Shared delivery improvements apply to all built assets; per-page timings after login have not been benchmarked.
- Real hosting latency, Supabase latency, real devices and repeat-run medians are not measured. Scores vary with test conditions: https://developer.chrome.com/docs/lighthouse/performance/performance-scoring
- The app retains hash routes for private screens. SEO metadata is not access control; authentication remains the protection. There is no public, server-rendered content library or per-route indexing.
- Canonical URLs, sitemap and share-image URLs require the final public domain and public content strategy. They are not fabricated for localhost. A Lighthouse SEO score is not a guarantee of indexing or rankings.
