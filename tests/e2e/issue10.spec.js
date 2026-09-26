import { test, expect } from '@playwright/test';
import pg from 'pg';
import { randomUUID } from 'node:crypto';

const password = 'TestPassword123';
const sync = page => page.getByRole('button', { name: 'ดึงข้อมูลล่าสุด', exact: true });
async function account(page) {
  const email = `sync-ui-${randomUUID()}@example.com`;
  expect((await page.request.post('/api/register', { data: { name: 'Sync learner', email, password } })).ok()).toBeTruthy();
  return email;
}
async function cleanup(email) {
  const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
  try { await pool.query('DELETE FROM users WHERE email=$1', [email]); } finally { await pool.end(); }
}
async function secondDevice(browser, page, email, baseURL) {
  const context = await browser.newContext({ baseURL, viewport: page.viewportSize() });
  expect((await context.request.post('/api/login', { data: { email, password } })).ok()).toBeTruthy();
  return context;
}
async function discardReload(page) {
  await sync(page).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
}

test('Issue #10: separate sessions sync decks and preserve a stale dirty draft', async ({ page, browser, baseURL }) => {
  const email = await account(page);
  const device = await secondDevice(browser, page, email, baseURL);
  try {
    const response = await page.request.post('/api/decks', { data: { name: 'Original deck', cards: [{ front: 'Original question', back: 'Original answer' }] } });
    expect(response.ok()).toBeTruthy();
    const { id } = await response.json();
    const other = await device.newPage();
    await page.goto(`/#/edit/${id}`);
    await other.goto('/#/decks');
    await expect(other.getByRole('heading', { name: 'Original deck', exact: true })).toBeVisible();
    await page.getByLabel('ชื่อชุดการ์ด', { exact: true }).fill('Changed on first device');
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด', exact: true }).click();
    await expect(page).toHaveURL(/#\/decks$/);
    await sync(other).click();
    await expect(other.getByRole('heading', { name: 'Changed on first device', exact: true })).toBeVisible();
    await other.getByRole('link', { name: 'Changed on first device', exact: true }).click();
    await page.getByRole('link', { name: 'Changed on first device', exact: true }).click();
    await other.getByLabel('คำอธิบาย', { exact: true }).fill('Unsent second-device draft');
    await page.getByLabel('ชื่อชุดการ์ด', { exact: true }).fill('Newer server deck');
    await page.getByRole('button', { name: 'บันทึกชุดการ์ด', exact: true }).click();
    await expect(page).toHaveURL(/#\/decks$/);
    await other.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(other.getByLabel('คำอธิบาย', { exact: true })).toHaveValue('Unsent second-device draft');
    const conflict = other.waitForResponse(r => r.url().endsWith(`/api/decks/${id}`) && r.request().method() === 'PUT');
    await other.getByRole('button', { name: 'บันทึกชุดการ์ด', exact: true }).click();
    expect((await conflict).status()).toBe(409);
    await expect(other.getByLabel('คำอธิบาย', { exact: true })).toHaveValue('Unsent second-device draft');
    await expect(other.getByLabel('คำอธิบาย', { exact: true })).toBeEnabled();
    expect((await (await page.request.get(`/api/decks/${id}`)).json()).name).toBe('Newer server deck');
    await sync(other).click();
    await other.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
    await expect(other.getByLabel('คำอธิบาย', { exact: true })).toHaveValue('Unsent second-device draft');
    await discardReload(other);
    await expect(other.getByLabel('ชื่อชุดการ์ด', { exact: true })).toHaveValue('Newer server deck');
    await expect(other.getByLabel('คำอธิบาย', { exact: true })).toHaveValue('');
    expect(await other.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  } finally { await device.close(); await cleanup(email); }
});

test('Issue #10: notes sync across sessions without overwriting an unsaved note', async ({ page, browser, baseURL }) => {
  const email = await account(page);
  const device = await secondDevice(browser, page, email, baseURL);
  try {
    const response = await page.request.post('/api/notes', { data: { title: 'Original note', body: 'Original note body' } });
    expect(response.ok()).toBeTruthy();
    const { id } = await response.json();
    const other = await device.newPage();
    await page.goto(`/#/notes?edit=${id}`);
    await other.goto(`/#/notes?edit=${id}`);
    await expect(other.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Original note body');
    await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('First device saved body');
    await page.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    await expect(page.getByRole('article').filter({ hasText: 'First device saved body' })).toBeVisible();
    await sync(other).click();
    await expect(other.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('First device saved body');
    await other.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('Keep this unsaved note');
    await page.getByRole('article').filter({ hasText: 'Original note' }).getByRole('button', { name: 'แก้ไขโน้ต', exact: true }).click();
    await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('Latest saved note body');
    await page.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    await expect(page.getByRole('article').filter({ hasText: 'Latest saved note body' })).toBeVisible();
    await other.evaluate(() => window.dispatchEvent(new Event('online')));
    await expect(other.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Keep this unsaved note');
    const conflict = other.waitForResponse(r => r.url().endsWith(`/api/notes/${id}`) && r.request().method() === 'PUT');
    await other.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    expect((await conflict).status()).toBe(409);
    await expect(other.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Keep this unsaved note');
    await expect(other.getByLabel('เนื้อหาโน้ต', { exact: true })).toBeEnabled();
    await discardReload(other);
    await expect(other.getByLabel('เนื้อหาโน้ต', { exact: true })).toHaveValue('Latest saved note body');
    expect(await other.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  } finally { await device.close(); await cleanup(email); }
});

for (const kind of ['decks', 'notes']) {
  test(`Issue #10: lost ${kind} save response retries the same request without duplication`, async ({ page }) => {
    const email = await account(page);
    try {
      await page.goto(kind === 'decks' ? '/#/create' : '/#/notes');
      const title = page.getByLabel(kind === 'decks' ? 'ชื่อชุดการ์ด' : 'ชื่อโน้ต', { exact: true });
      await title.fill('Saved exactly once');
      if (kind === 'decks') {
        await page.getByRole('button', { name: 'เพิ่มเอง', exact: true }).click();
        await page.getByLabel('ด้านหน้า · คำถาม', { exact: true }).fill('Unique question');
        await page.getByLabel('ด้านหลัง · คำตอบ', { exact: true }).fill('Unique answer');
      } else await page.getByLabel('เนื้อหาโน้ต', { exact: true }).fill('Unique note body');
      const requests = [];
      await page.route(`**/api/${kind}`, async route => {
        if (route.request().method() !== 'POST') return route.continue();
        requests.push(route.request().postDataJSON());
        if (requests.length === 1) {
          const committed = await route.fetch();
          expect(committed.ok()).toBeTruthy();
          return route.abort('failed');
        }
        return route.continue();
      });
      const save = page.getByRole('button', { name: kind === 'decks' ? 'บันทึกชุดการ์ด' : 'บันทึกโน้ต', exact: true });
      await save.click();
      await expect(title).toBeDisabled();
      await expect(title).toHaveValue('Saved exactly once');
      await expect(save).toBeEnabled();
      await save.click();
      await expect(page.getByRole('heading', { name: 'Saved exactly once', exact: true })).toBeVisible();
      expect(requests).toHaveLength(2);
      expect(requests[0].request_id).toBeTruthy();
      expect(requests[1]).toEqual(requests[0]);
      const saved = await (await page.request.get(`/api/${kind}`)).json();
      expect(saved[kind]).toHaveLength(1);
    } finally { await cleanup(email); }
  });
}

test('Issue #10: failed background reload keeps visible decks and can retry', async ({ page }) => {
  const email = await account(page);
  try {
    expect((await page.request.post('/api/decks', { data: { name: 'Visible during outage', cards: [{ front: 'Question', back: 'Answer' }] } })).ok()).toBeTruthy();
    await page.goto('/#/decks');
    const heading = page.getByRole('heading', { name: 'Visible during outage', exact: true });
    await expect(heading).toBeVisible();
    await page.route('**/api/decks', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary sync outage' }) }));
    await sync(page).click();
    await expect(page.getByLabel('สถานะการซิงค์', { exact: true })).toContainText(/ไม่สำเร็จ|ผิดพลาด|เชื่อมต่อ|Temporary/);
    await expect(heading).toBeVisible();
    await page.unroute('**/api/decks');
    const reloaded = page.waitForResponse(r => r.url().endsWith('/api/decks') && r.request().method() === 'GET');
    await sync(page).click();
    expect((await reloaded).ok()).toBeTruthy();
    await expect(heading).toBeVisible();
  } finally { await cleanup(email); }
});

test('Issue #10: 30-second polling observes remote create, update and delete', async ({ page, browser, baseURL }) => {
  const email = await account(page);
  const device = await secondDevice(browser, page, email, baseURL);
  try {
    await page.clock.install();
    await page.goto('/#/decks');
    await expect(page.getByRole('heading', { name: 'เริ่มจากความรู้เรื่องที่คุณสนใจ', exact: true })).toBeVisible();
    const created = await device.request.post('/api/decks', { data: { name: 'Remote created deck', cards: [{ front: 'Polling question', back: 'Polling answer' }] } });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();
    await page.clock.fastForward(30000);
    await expect(page.getByRole('heading', { name: 'Remote created deck', exact: true })).toBeVisible();
    const initial = await (await device.request.get(`/api/decks/${id}`)).json();
    expect((await device.request.put(`/api/decks/${id}`, { data: { ...initial, name: 'Remote updated deck', request_id: randomUUID() } })).ok()).toBeTruthy();
    await page.clock.fastForward(30000);
    await expect(page.getByRole('heading', { name: 'Remote updated deck', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Remote created deck', exact: true })).toHaveCount(0);
    const updated = await (await device.request.get(`/api/decks/${id}`)).json();
    expect((await device.request.delete(`/api/decks/${id}`, { data: { revision: updated.revision } })).ok()).toBeTruthy();
    await page.clock.fastForward(30000);
    await expect(page.getByRole('heading', { name: 'Remote updated deck', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'เริ่มจากความรู้เรื่องที่คุณสนใจ', exact: true })).toBeVisible();
  } finally { await device.close(); await cleanup(email); }
});

test('Issue #10: confirmed reload failure preserves editor draft until successful retry', async ({ page }) => {
  const email = await account(page);
  try {
    const created = await page.request.post('/api/decks', { data: { name: 'Reload source deck', cards: [{ front: 'Saved question', back: 'Saved answer' }] } });
    expect(created.ok()).toBeTruthy();
    const { id } = await created.json();
    await page.goto(`/#/edit/${id}`);
    const title = page.getByLabel('ชื่อชุดการ์ด', { exact: true });
    await expect(title).toHaveValue('Reload source deck');
    await title.fill('Do not lose this draft');
    await page.route(`**/api/decks/${id}`, route => route.request().method() === 'GET'
      ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Temporary sync outage' }) })
      : route.continue());
    await discardReload(page);
    await expect(page.getByLabel('สถานะการซิงค์', { exact: true })).toContainText(/ไม่สำเร็จ|ผิดพลาด|เชื่อมต่อ|Temporary/);
    await expect(title).toHaveValue('Do not lose this draft');
    await expect(title).toBeEnabled();
    await expect(page.getByLabel('ด้านหน้า · คำถาม', { exact: true })).toHaveValue('Saved question');
    await page.unroute(`**/api/decks/${id}`);
    await discardReload(page);
    await expect(title).toHaveValue('Reload source deck');
    await expect(title).toBeEnabled();
  } finally { await cleanup(email); }
});
