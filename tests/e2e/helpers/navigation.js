import { expect } from '@playwright/test';

// Exercise the visible navigation, including the mobile overflow menu.
export async function navigateTo(page, href) {
  const visibleLink = page.locator(`nav a[href="${href}"]:visible`);
  if (await visibleLink.count()) {
    await visibleLink.first().click();
  } else {
    await page.getByRole('button', { name: /เพิ่มเติม/ }).click();
    await page.locator(`#mobile-more a[href="${href}"]`).click();
  }
  await expect(page).toHaveURL(new RegExp(href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'));
}
