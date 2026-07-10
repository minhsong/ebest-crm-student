import { expect, test } from '@playwright/test';

import {
	buildMockDrillAuthorizeSuccess,
	buildMockDrillPlayPayload,
	buildMockDrillStartResponse,
	MOCK_DRILL_PLAY_ID,
} from '../fixtures/drill-runtime-mock';
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
 * T1 — ready → authorize → start → playing URL (mock BFF).
 */
test.describe('Games Hub — assignment start mock', () => {
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

		await page.route('**/api/student/learning/drill/authorize**', async (route) => {
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(
					buildMockDrillAuthorizeSuccess({
						assignmentId: ASSIGNMENT_ID,
						minimumScore: 15,
						poolSize: 20,
					}),
				),
			});
		});

		await page.route('**/api/learning-drill-runtime/plays**', async (route) => {
			const method = route.request().method();
			const url = route.request().url();

			if (method === 'POST' && !url.includes(MOCK_DRILL_PLAY_ID)) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(
						buildMockDrillStartResponse({ assignmentId: ASSIGNMENT_ID }),
					),
				});
				return;
			}

			if (method === 'GET' && url.includes(MOCK_DRILL_PLAY_ID)) {
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify(
						buildMockDrillPlayPayload('in_progress', 0, {
							assignmentId: ASSIGNMENT_ID,
						}),
					),
				});
				return;
			}

			await route.continue();
		});

		await page.route('**/api/drill-ws/token**', async (route) => {
			await route.fulfill({ status: 404, body: '' });
		});
	});

	test('T1 assignment ready → start → playing', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/ready?classId=12&assignmentId=${ASSIGNMENT_ID}`,
		);
		await expect(page.getByRole('button', { name: 'Bắt đầu làm bài' })).toBeEnabled();
		await page.getByRole('button', { name: 'Bắt đầu làm bài' }).click();
		await expect(page).toHaveURL(
			new RegExp(`/meaning-to-word/playing.*playId=${MOCK_DRILL_PLAY_ID}`),
			{ timeout: 15_000 },
		);
		await expect(page.getByText('một')).toBeVisible({ timeout: 10_000 });
	});
});
