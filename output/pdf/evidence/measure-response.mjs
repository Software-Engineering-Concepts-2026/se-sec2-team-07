import { performance } from 'node:perf_hooks';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const base = process.argv[3] || 'https://focus-flashcards.vercel.app';
const file = process.argv[4] || '.local/production-response-report.json';
const mode = process.argv[2] || 'initial';
const report = mode === 'idle'
  ? JSON.parse(await readFile(file, 'utf8'))
  : { target: base, started: new Date().toISOString(), http: [], browser: [] };
if (mode === 'idle') {
  const quietMs = Date.now() - Date.parse(report.quietStarted);
  if (quietMs < 330000) throw Error(`Need at least 330 seconds without test traffic; elapsed ${Math.round(quietMs / 1000)} seconds.`);
  report.testIdleSeconds = Math.round(quietMs / 1000);
}
const save = () => writeFile(file, JSON.stringify(report, null, 2));
async function measureHttp(path, label) {
  const start = performance.now();
  const response = await fetch(base + path, { signal: AbortSignal.timeout(60000), redirect: 'error' });
  const headersMs = performance.now() - start;
  const body = await response.text();
  const result = {
    label, path, status: response.status, headersMs: Math.round(headersMs),
    totalMs: Math.round(performance.now() - start), bytes: Buffer.byteLength(body),
    cache: response.headers.get('x-vercel-cache'), region: response.headers.get('x-vercel-id')?.split('::')[0],
  };
  if (path === '/') result.assets = [...body.matchAll(/(?:src|href)="(\/assets\/[^"<>]+\.(?:js|css))"/g)].map(m => m[1]);
  report.http.push(result);
  console.log(JSON.stringify(result));
  await save();
}
const browser = await chromium.launch({ channel: 'chrome', headless: true });
async function measureBrowser(device, label) {
  const context = await browser.newContext({
    viewport: device === 'desktop' ? { width: 1440, height: 1000 } : { width: 390, height: 844 },
    isMobile: device === 'mobile',
  });
  try {
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const start = performance.now();
    const response = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByLabel('อีเมล', { exact: true }).waitFor({ state: 'visible', timeout: 60000 });
    const readyMs = Math.round(performance.now() - start);
    const timings = await page.evaluate(() => ({
      navigation: performance.getEntriesByType('navigation').map(n => ({
        ttfbMs: Math.round(n.responseStart - n.startTime), domContentLoadedMs: Math.round(n.domContentLoadedEventEnd - n.startTime),
      })),
      api: performance.getEntriesByType('resource').filter(r => new URL(r.name).pathname.startsWith('/api/')).map(r => ({ path: new URL(r.name).pathname, durationMs: Math.round(r.duration) })),
      assets: [...document.querySelectorAll('script[src]')].map(s => new URL(s.src).pathname),
    }));
    const result = { device, label, status: response.status(), readyMs, errors, ...timings };
    report.browser.push(result);
    console.log(JSON.stringify(result));
    await save();
  } finally {
    await context.close();
  }
}
try {
  if (mode === 'initial') {
    await measureBrowser('desktop', 'first opening; preceding traffic unknown');
    for (let round = 1; round <= 3; round++) {
      await measureBrowser('desktop', `repeat desktop ${round}`);
      await measureBrowser('mobile', `repeat mobile ${round}`);
    }
    for (let round = 1; round <= 5; round++) {
      await measureHttp('/', `repeat HTML ${round}`);
      await measureHttp('/api/health', `repeat database health ${round}`);
      await measureHttp('/api/me', `repeat anonymous session ${round}`);
    }
    report.quietStarted = new Date().toISOString();
    console.log(`QUIET_STARTED ${report.quietStarted}; no more test requests until the idle measurement.`);
  } else if (mode === 'idle') {
    await measureBrowser('desktop', `opening after ${report.testIdleSeconds} seconds without test requests`);
    await measureHttp('/api/health', 'database health after idle browser opening');
    await measureBrowser('desktop', 'immediate reopening after idle opening');
    report.completed = new Date().toISOString();
  } else throw Error('Unknown measurement mode.');
} finally {
  await browser.close();
  await save();
}
