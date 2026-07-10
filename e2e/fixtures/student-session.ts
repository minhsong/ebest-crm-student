import type { Page } from '@playwright/test';

/** Mock phiên học viên tối thiểu — route tree E2E, không gọi CRM/Gateway. */
export async function stubStudentPortalSession(page: Page) {
	await page.route('**/api/lead/me**', async (route) => {
		await route.fulfill({ status: 401, contentType: 'application/json', body: '{}' });
	});

	await page.route('**/api/me', async (route) => {
		await route.fulfill({
			status: 200,
			contentType: 'application/json',
			body: JSON.stringify({
				customer: {
					id: 1,
					fullName: 'E2E Student',
					classes: [{ id: 12, name: 'Lớp E2E', status: 'active' }],
				},
			}),
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
