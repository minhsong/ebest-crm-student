import { expect, test } from '@playwright/test';

import { stubStudentPortalSession } from '../fixtures/student-session';

/**
 * Games Hub — redirect / routing (mock session, không Gateway).
 * §10.2 T6, T11
 */
test.describe('Games Hub — public redirects', () => {
	test.beforeEach(async ({ page }) => {
		await stubStudentPortalSession(page);
	});

	test('T11 legacy /learning/practice?classId= → slug ready', async ({ page }) => {
		await page.goto('/learning/practice?classId=12');
		await expect(page).toHaveURL(/\/learning\/games\/meaning-to-word\/ready/);
		await expect(page).toHaveURL(/classId=12/);
	});

	test('T11 legacy /learning/drill?assignmentId= preserves query', async ({ page }) => {
		await page.goto('/learning/drill?classId=12&assignmentId=99');
		await expect(page).toHaveURL(/assignmentId=99/);
		await expect(page).toHaveURL(/\/ready/);
	});

	test('T6 invalid game slug → not found', async ({ page }) => {
		await page.goto('/learning/games/not-a-real-game/ready');
		await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
	});
});
