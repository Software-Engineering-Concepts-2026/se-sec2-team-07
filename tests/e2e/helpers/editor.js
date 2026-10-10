import { expect } from '@playwright/test';

// Creation shows one draft at a time; count cards through the user's selector.
export async function expectDraftCount(page, count) {
  await expect(page.getByLabel('เลือกการ์ดที่ต้องการแก้ไข').getByRole('option')).toHaveCount(count);
  await expect(page.getByRole('textbox', { name: 'ด้านหน้า · คำถาม', exact: true })).toHaveCount(1);
}

export async function selectDraftCard(page, number) {
  const selector = page.getByLabel('เลือกการ์ดที่ต้องการแก้ไข');
  const option = selector.getByRole('option', { name: new RegExp(`^การ์ด ${number}:`) });
  await expect(option).toHaveCount(1);
  await selector.selectOption(await option.getAttribute('value'));
}
