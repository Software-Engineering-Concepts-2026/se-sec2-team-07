import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

// No accounts or learning data are created or changed on the deployed database.
test('public app renders and login handles invalid credentials without runtime errors', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByLabel('อีเมล', { exact: true })).toBeVisible();
  await expect(page.getByLabel('รหัสผ่าน', { exact: true })).toBeVisible();
  await page.getByLabel('อีเมล', { exact: true }).fill(`deployment-${randomUUID()}@example.com`);
  await page.getByLabel('รหัสผ่าน', { exact: true }).fill('NonexistentAccountPassword123');
  const response = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === '/api/login' && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  expect((await response).status()).toBe(401);
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('tab', { name: 'สมัครใหม่', exact: true }).click();
  await expect(page.getByLabel('ชื่อที่อยากให้เราเรียก')).toBeVisible();
  expect(errors).toEqual([]);
});
