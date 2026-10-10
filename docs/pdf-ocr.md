# PDF OCR fallback

PDF extraction keeps the normal text path for valid pages. Pages with missing
characters (NUL / replacement characters), or fewer than 10 text characters,
are rendered at 2000 pixels wide and read with Tesseract.js (`tha+eng`).
Valid pages are preserved; OCR pages stay in document order.

The first OCR request downloads language models and caches them under
`.local/ocr` (ignored by Git). Internet access is needed for that initial
download. Recognition runs locally on the server; document images are not sent
to an AI provider. Preserve the cache between deployments if possible.

Limits: 20 MB input, 100 PDF pages, at most 10 OCR pages, 60,000 extracted
characters, 180 seconds per request and four concurrent extraction processes
per API process. A failed request does not replace the editor's previous draft.
Large deployments need a shared job queue and resource limits.

`POST /api/extract` returns `text`, `ocrPages` (1-based) and `requiresReview`.
The card editor displays an OCR notice and requires confirmation before
generation; editing source text clears the confirmation. This is a client-side
review workflow, not a server-side authorization check. Other document callers
retain the string extraction API for compatibility.

Verification: tested the supplied two-page vocabulary PDF with real Thai/English
OCR. Both pages triggered fallback and Thai meanings became readable. IPA and
some pronunciation text remain inaccurate: review is essential. OCR does not
guarantee exact transcription, preserve table cells, or repair existing cards.
Readable-but-incorrect text without missing-character markers may not trigger
fallback. Handwriting, rotated scans, other languages, production proxy timeouts
and concurrent load have not been verified. No live AI calls or production
database changes are needed for this feature.

Regression commands:

```
node --test tests/unit/pdf-ocr.test.js tests/unit/issue3-extraction.test.js
npm run build
node --env-file=.env node_modules/playwright/cli.js test tests/e2e/issue3.spec.js
```

Browser tests require the isolated test database and simulate OCR response
metadata; the real supplied PDF was checked separately without committing it.
