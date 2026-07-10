import { expect, test } from '@playwright/test';

/**
 * Games Hub — flow cần phiên học viên.
 * §10.2 T1 (partial), T7, T8
 */
test.describe('Games Hub — authenticated', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !process.env.E2E_PORTAL_LOGIN_ID || !process.env.E2E_PORTAL_PASSWORD,
      'Set E2E_PORTAL_LOGIN_ID + E2E_PORTAL_PASSWORD',
    );
  });

  test.beforeEach(async ({ page }) => {
    await page.route('**/api/student/learning/hub**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          classes: [{ id: 12, name: 'Lớp E2E', status: 'active' }],
          weekStats: { weekDrillScore: 0, weekDrillPlays: 0 },
        }),
      });
    });
  });

  test('T1 catalog hiển thị game cards', async ({ page }) => {
    await page.goto('/learning/games');
    await expect(page.getByRole('heading', { name: 'Game luyện từ' })).toBeVisible();
    await expect(page.getByText('Nghĩa → chọn từ')).toBeVisible();
    await expect(page.getByText('Nghe → chọn từ')).toBeVisible();
  });

  test('T7 assignment deep link mở ready với assignmentId', async ({ page }) => {
    await page.goto('/learning/games/meaning-to-word/ready?classId=12&assignmentId=99');
    await expect(page).toHaveURL(/assignmentId=99/);
    await expect(page).toHaveURL(/\/meaning-to-word\/ready/);
  });

  test('T8 checklist deep link mở ready với checklistId', async ({ page }) => {
    await page.goto('/learning/games/meaning-to-word/ready?classId=12&checklistId=7&modeId=best_of');
    await expect(page).toHaveURL(/checklistId=7/);
    await expect(page).toHaveURL(/modeId=best_of/);
  });
});
