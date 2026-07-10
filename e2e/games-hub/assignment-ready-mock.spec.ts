import { expect, test } from '@playwright/test';

import { stubStudentPortalSession } from '../fixtures/student-session';

const ASSIGNMENT_ID = 99;
const ASSIGNMENT_TITLE = 'Luyện từ vựng — Buổi 3 (đạt 15 điểm)';

const assignmentContext = {
	assignmentId: ASSIGNMENT_ID,
	classId: 12,
	title: ASSIGNMENT_TITLE,
	minimumScore: 15,
	modeId: 'survival',
	promptType: 'meaning_to_word',
	assignmentPoolSize: 20,
	unlockPoolSize: 50,
	bestScore: 0,
	assignmentComplete: false,
	canPlay: true,
	contextKind: 'assignment',
	config: { wordScopeMode: 'class_pool' },
};

const vocabularyPool = {
	practiceEnabled: true,
	audioEntryCount: 10,
	imageEntryCount: 8,
	learningAccess: { canRecordEvents: true },
};

/**
 * Assignment ready — mock BFF (không cần CRM thật).
 * Bổ sung T7: hiển thị lobby bài tập + CTA.
 */
test.describe('Games Hub — assignment ready mock', () => {
	test.beforeEach(async ({ page }) => {
		await stubStudentPortalSession(page);

		await page.route(
			`**/api/student/learning/drill/assignments/${ASSIGNMENT_ID}/context**`,
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(assignmentContext),
				});
			},
		);

		await page.route('**/api/student/learning/classes/*/vocabulary-pool**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(vocabularyPool),
			});
		});

		await page.route('**/api/learning-drill-runtime/plays/active**', async (route) => {
			await route.fulfill({ status: 404, body: '' });
		});
	});

	test('T7b assignment ready hiển thị tiêu đề và CTA', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/ready?classId=12&assignmentId=${ASSIGNMENT_ID}`,
		);
		await expect(page.getByRole('heading', { name: ASSIGNMENT_TITLE }).first()).toBeVisible();
		await expect(page.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeEnabled();
	});

	test('T7c assignment speed_run deep link giữ slug audio', async ({ page }) => {
		await page.route(
			`**/api/student/learning/drill/assignments/${ASSIGNMENT_ID}/context**`,
			async (route) => {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						...assignmentContext,
						modeId: 'speed_run',
						promptType: 'audio_to_word',
						title: 'Luyện nghe — Speed run',
					}),
				});
			},
		);

		await page.goto(
			`/learning/games/audio-to-word/ready?classId=12&assignmentId=${ASSIGNMENT_ID}`,
		);
		await expect(page).toHaveURL(/\/audio-to-word\/ready/);
		await expect(page.getByRole('heading', { name: 'Luyện nghe — Speed run' }).first()).toBeVisible();
	});
});
