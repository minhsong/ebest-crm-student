import { expect, test } from '@playwright/test';

import { buildMockDrillAuthorizeSuccess } from '../fixtures/drill-runtime-mock';
import { stubStudentPortalSession } from '../fixtures/student-session';

const CHECKLIST_ID = 7;

/**
 * T8 — checklist deep link + prefetch authorize → lobby đầy đủ.
 */
test.describe('Games Hub — checklist ready mock', () => {
	test.beforeEach(async ({ page }) => {
		await stubStudentPortalSession(page);

		await page.route('**/api/learning-drill-runtime/plays/active**', async (route) => {
			await route.fulfill({ status: 404, body: '' });
		});

		await page.route('**/api/student/learning/drill/authorize**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(
					buildMockDrillAuthorizeSuccess({
						checklistId: CHECKLIST_ID,
						modeId: 'pool_coverage',
						minimumScore: 8,
						poolSize: 12,
					}),
				),
			});
		});
	});

	test('T8b checklist ready hiển thị lobby phạt game', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/ready?classId=12&checklistId=${CHECKLIST_ID}&modeId=best_of`,
		);
		await expect(page.getByRole('heading', { name: 'Nhiệm vụ luyện từ' }).first()).toBeVisible();
		await expect(page.getByText('Bạn đã bị Cô phạt chơi game')).toBeVisible();
		await expect(page.getByText('Cần đạt')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeEnabled();
	});
});
