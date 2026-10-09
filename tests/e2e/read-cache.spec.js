import { test, expect } from '@playwright/test';
import { navigateTo } from './helpers/navigation.js';

const deck = (name) => ({
  id: 1,
  name,
  description: '',
  category: 'ทั่วไป',
  color: 'purple',
  card_count: 1,
  due_count: 1,
  learned: 0,
});
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => (resolve = done));
  return { promise, resolve };
};
async function mockApi(page, handle) {
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (await handle(route, path, request.method())) return;
    const defaults = {
      '/api/me': { user: { id: 1, name: 'Account A', email: 'a@example.com' }, ai: false },
      '/api/notes': { notes: [] },
      '/api/documents': { documents: [] },
      '/api/courses': { courses: [] },
    };
    await route.fulfill({ json: defaults[path] || { ok: true } });
  });
}

test('route revisit shows known decks while a delayed network refresh updates them', async ({
  page,
}) => {
  const gate = deferred();
  let reads = 0;
  await mockApi(page, async (route, path) => {
    if (path !== '/api/decks') return false;
    reads++;
    if (reads > 1) await gate.promise;
    await route.fulfill({ json: { decks: [deck(reads === 1 ? 'Known deck' : 'Fresh deck')] } });
    return true;
  });
  try {
    await page.goto('/#/decks');
    await expect(page.getByRole('heading', { name: 'Known deck', exact: true })).toBeVisible();
    await navigateTo(page, '#/notes');
    await expect(page.getByLabel('ชื่อโน้ต')).toBeEnabled();
    const refreshing = page.waitForRequest('**/api/decks');
    await navigateTo(page, '#/decks');
    await refreshing;
    await expect(page.getByRole('heading', { name: 'Known deck', exact: true })).toBeVisible({
      timeout: 1000,
    });
    await expect(page.getByText('กำลังเปิดคลังการ์ด…', { exact: true })).toHaveCount(0);
    gate.resolve();
    await expect(page.getByRole('heading', { name: 'Fresh deck', exact: true })).toBeVisible();
  } finally {
    gate.resolve();
  }
});

test('a successful mutation invalidates the previous route cache', async ({ page }) => {
  const gate = deferred();
  let written = false;
  await mockApi(page, async (route, path, method) => {
    if (path === '/api/notes' && method === 'POST') {
      written = true;
      await route.fulfill({ json: { id: 1 } });
      return true;
    }
    if (path !== '/api/decks') return false;
    if (written) await gate.promise;
    await route.fulfill({ json: { decks: [deck(written ? 'Updated deck' : 'Old deck')] } });
    return true;
  });
  try {
    await page.goto('/#/decks');
    await expect(page.getByRole('heading', { name: 'Old deck', exact: true })).toBeVisible();
    await navigateTo(page, '#/notes');
    await page.getByLabel('ชื่อโน้ต').fill('A new note');
    await page.getByLabel('เนื้อหาโน้ต').fill('A saved mutation changes shared data.');
    const saved = page.waitForResponse(
      (response) => response.url().endsWith('/api/notes') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'บันทึกโน้ต', exact: true }).click();
    await saved;
    await expect(page.getByLabel('ชื่อโน้ต')).toHaveValue('');
    const loading = page.waitForRequest('**/api/decks');
    await navigateTo(page, '#/decks');
    await loading;
    await expect(page.getByText('กำลังเปิดคลังการ์ด…', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Old deck', exact: true })).toHaveCount(0);
    gate.resolve();
    await expect(page.getByRole('heading', { name: 'Updated deck', exact: true })).toBeVisible();
  } finally {
    gate.resolve();
  }
});

test('session expiry and another login never show the previous account cache', async ({ page }) => {
  const gate = deferred();
  let account = 1;
  let expired = false;
  await mockApi(page, async (route, path, method) => {
    if (path === '/api/login' && method === 'POST') {
      account = 2;
      expired = false;
      await route.fulfill({ json: { ok: true } });
      return true;
    }
    if (path === '/api/me') {
      await route.fulfill({
        json: {
          user: { id: account, name: `Account ${account}`, email: 'test@example.com' },
          ai: false,
        },
      });
      return true;
    }
    if (path === '/api/notes' && expired) {
      await route.fulfill({ status: 401, json: { error: 'Session expired' } });
      return true;
    }
    if (path !== '/api/decks') return false;
    if (account === 2) await gate.promise;
    await route.fulfill({ json: { decks: [deck(`Private account ${account}`)] } });
    return true;
  });
  try {
    await page.goto('/#/decks');
    await expect(
      page.getByRole('heading', { name: 'Private account 1', exact: true }),
    ).toBeVisible();
    expired = true;
    await navigateTo(page, '#/notes');
    await expect(page.getByLabel('อีเมล', { exact: true })).toBeVisible();
    await page.getByLabel('อีเมล', { exact: true }).fill('b@example.com');
    await page.getByLabel('รหัสผ่าน', { exact: true }).fill('TestPassword123');
    await page.locator('form').getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
    await expect(page.getByLabel('ชื่อโน้ต')).toBeEnabled();
    const loading = page.waitForRequest('**/api/decks');
    await navigateTo(page, '#/decks');
    await loading;
    await expect(page.getByText('กำลังเปิดคลังการ์ด…', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Private account 1', exact: true })).toHaveCount(
      0,
    );
    gate.resolve();
    await expect(
      page.getByRole('heading', { name: 'Private account 2', exact: true }),
    ).toBeVisible();
  } finally {
    gate.resolve();
  }
});

test('a read delayed across a successful mutation is discarded and fetched again', async ({
  page,
}) => {
  const stale = deferred();
  const fresh = deferred();
  let reads = 0;
  let renamed = false;
  await mockApi(page, async (route, path, method) => {
    if (path === '/api/documents/1' && method === 'PUT') {
      renamed = true;
      await route.fulfill({ json: { ok: true } });
      return true;
    }
    if (path === '/api/documents') {
      await route.fulfill({
        json: {
          documents: [
            {
              id: 1,
              title: renamed ? 'Renamed document' : 'Original document',
              name: 'a.txt',
              body: 'Text',
            },
          ],
        },
      });
      return true;
    }
    if (path !== '/api/notes') return false;
    const read = ++reads;
    if (read === 2) await stale.promise;
    if (read === 3) await fresh.promise;
    await route.fulfill({
      json: {
        notes: [
          {
            id: 1,
            title: read === 1 ? 'Saved note' : read === 2 ? 'Stale response' : 'Fresh note',
            body: 'Text',
            revision: 1,
            courses: [],
          },
        ],
      },
    });
    return true;
  });
  try {
    await page.goto('/#/notes');
    await expect(page.getByRole('heading', { name: 'Saved note', exact: true })).toBeVisible();
    const delayed = page.waitForRequest('**/api/notes');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await delayed;
    await page.getByRole('button', { name: 'เปลี่ยนชื่อเอกสาร', exact: true }).click();
    await page.getByLabel('ชื่อเอกสาร', { exact: true }).fill('Renamed document');
    const saved = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/documents/1') && response.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: 'บันทึกชื่อเอกสาร', exact: true }).click();
    await saved;
    stale.resolve();
    await expect.poll(() => reads).toBe(3);
    await expect(page.getByRole('heading', { name: 'Stale response', exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Saved note', exact: true })).toBeVisible();
    fresh.resolve();
    await expect(page.getByRole('heading', { name: 'Fresh note', exact: true })).toBeVisible();
  } finally {
    stale.resolve();
    fresh.resolve();
  }
});

test('courses reuse the list while validation preserves a typed course name', async ({ page }) => {
  const gate = deferred();
  let reads = 0;
  await mockApi(page, async (route, path) => {
    if (path !== '/api/courses') return false;
    const read = ++reads;
    if (read > 1) await gate.promise;
    await route.fulfill({
      json: {
        courses: [
          {
            id: 1,
            name: read === 1 ? 'Known course' : 'Fresh course',
            card_count: 0,
            note_count: 0,
          },
        ],
      },
    });
    return true;
  });
  try {
    await page.goto('/#/courses');
    await expect(page.getByRole('heading', { name: 'Known course', exact: true })).toBeVisible();
    await navigateTo(page, '#/notes');
    await expect(page.getByLabel('ชื่อโน้ต')).toBeEnabled();
    const refreshing = page.waitForRequest('**/api/courses');
    await navigateTo(page, '#/courses');
    await refreshing;
    await expect(page.getByRole('heading', { name: 'Known course', exact: true })).toBeVisible();
    await expect(page.getByText('กำลังตรวจรายวิชาล่าสุด…', { exact: true })).toBeVisible();
    await page.getByLabel('ชื่อรายวิชาใหม่').fill('Unsaved course name');
    await expect(page.getByRole('button', { name: 'สร้างรายวิชา', exact: true })).toBeDisabled();
    gate.resolve();
    await expect(page.getByRole('heading', { name: 'Fresh course', exact: true })).toBeVisible();
    await expect(page.getByLabel('ชื่อรายวิชาใหม่')).toHaveValue('Unsaved course name');
    await expect(page.getByRole('button', { name: 'สร้างรายวิชา', exact: true })).toBeEnabled();
  } finally {
    gate.resolve();
  }
});

test('schedule cache validates before settings writes and protects unsaved minutes', async ({
  page,
}) => {
  const gate = deferred();
  let reads = 0;
  let savedMinutes = 30;
  const plan = (minutes) => ({
    minutes,
    cards: [],
    days: [],
    remaining_seconds: minutes * 60,
    spent_seconds: 0,
    due_count: 0,
    deferred_count: 0,
    seconds_per_card: 30,
    next_due: null,
    beyond_week: 0,
  });
  await mockApi(page, async (route, path, method) => {
    if (path !== '/api/review/plan') return false;
    if (method === 'PUT') {
      savedMinutes = route.request().postDataJSON().minutes;
      await route.fulfill({ json: plan(savedMinutes) });
    } else {
      const read = ++reads;
      if (read === 2) await gate.promise;
      await route.fulfill({ json: plan(read === 1 ? 10 : savedMinutes) });
    }
    return true;
  });
  try {
    await page.goto('/#/schedule');
    const input = page.getByLabel('เวลาทบทวนต่อวัน (นาที)');
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue('10');
    await navigateTo(page, '#/courses');
    await expect(page.getByRole('heading', { name: 'ยังไม่มีรายวิชา', exact: true })).toBeVisible();
    const refreshing = page.waitForRequest('**/api/review/plan');
    await navigateTo(page, '#/schedule');
    await refreshing;
    await expect(input).toHaveValue('10');
    await expect(input).toBeDisabled();
    await expect(page.getByText('กำลังตรวจตารางล่าสุด…', { exact: true })).toBeVisible();
    gate.resolve();
    await expect(input).toBeEnabled();
    await expect(input).toHaveValue('30');
    await input.fill('25');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    expect(reads).toBe(2);
    await expect(input).toHaveValue('25');
    await page.getByRole('button', { name: 'บันทึกเวลาและปรับตาราง', exact: true }).click();
    await expect(
      page.getByText('บันทึกเวลาแล้ว ตารางปรับตามเวลาที่เลือก', { exact: true }),
    ).toBeVisible();
    const validated = page.waitForResponse('**/api/review/plan');
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await validated;
    await expect(input).toHaveValue('25');
    await expect(
      page.getByText('บันทึกเวลาแล้ว ตารางปรับตามเวลาที่เลือก', { exact: true }),
    ).toBeVisible();
  } finally {
    gate.resolve();
  }
});

test('dashboard seeds the library snapshot before its first delayed read', async ({ page }) => {
  const gate = deferred();
  await mockApi(page, async (route, path) => {
    if (path === '/api/stats/overview') {
      await route.fulfill({
        json: {
          decks: [deck('Overview deck')],
          stats: { total: 0, today: 0, streak: 0, weekly: [] },
        },
      });
      return true;
    }
    if (path !== '/api/decks') return false;
    await gate.promise;
    await route.fulfill({ json: { decks: [deck('Validated library deck')] } });
    return true;
  });
  try {
    await page.goto('/#/');
    await expect(page.getByRole('heading', { name: 'Overview deck', exact: true })).toBeVisible();
    const refreshing = page.waitForRequest('**/api/decks');
    await navigateTo(page, '#/decks');
    await refreshing;
    await expect(page.getByRole('heading', { name: 'Overview deck', exact: true })).toBeVisible({
      timeout: 1000,
    });
    await expect(page.getByText('กำลังเปิดคลังการ์ด…', { exact: true })).toHaveCount(0);
    gate.resolve();
    await expect(
      page.getByRole('heading', { name: 'Validated library deck', exact: true }),
    ).toBeVisible();
  } finally {
    gate.resolve();
  }
});
