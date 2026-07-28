import type { Page } from '@playwright/test';

const E2E_PORTAL_SESSION = {
  actor: 'customer',
  displayName: 'E2E Student',
  customer: {
    id: 1,
    fullName: 'E2E Student',
  },
  classes: [{ id: 12, name: 'Lớp E2E', status: 'active' }],
};

/** Mock phiên học viên tối thiểu — route tree E2E, không gọi CRM/Gateway. */
export async function stubStudentPortalSession(page: Page) {
  await page.route('**/api/lead/me**', async (route) => {
    await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
  });

  await page.route('**/api/portal/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(E2E_PORTAL_SESSION),
    });
  });

  /** Legacy compat — một số test cũ có thể còn stub path này. */
  await page.route('**/api/me', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(E2E_PORTAL_SESSION),
    });
  });

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
}
