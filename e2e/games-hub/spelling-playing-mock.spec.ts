import { expect, test } from '@playwright/test';

import { stubStudentPortalSession } from '../fixtures/student-session';

const MOCK_PLAY_ID = '00000000-0000-4000-8000-0000000000e2';

const mockSpellingQuestion = {
	questionId: 'q-spell-1',
	prompt: 'con mèo',
	promptType: 'image',
	promptImageUrl: 'https://cdn.example/cat.jpg',
	spellingTiles: [
		{ tileId: 't-c', letter: 'c' },
		{ tileId: 't-a', letter: 'a' },
		{ tileId: 't-t', letter: 't' },
	],
	letterCount: 3,
	spellingDifficulty: 'easy',
};

function buildSpellingPlayPayload(status: 'in_progress' | 'completed', scoreInRun = 0) {
	return {
		playId: MOCK_PLAY_ID,
		classId: 12,
		assignmentId: null,
		modeId: 'survival',
		promptType: 'spelling',
		scoreInRun,
		streak: 0,
		status,
		sessionConfig: {
			gameFamily: 'vocabulary_drill',
			modeId: 'survival',
			promptType: 'spelling',
			presentation: {
				modeLayoutProfileId: 'survival_streak',
				detailWidgetId: 'spelling_tiles',
				resultProfileId: 'survival_result',
			},
			rules: {
				answerTimeoutSec: 30,
				spellingDifficulty: 'easy',
				allowRetrySameItem: false,
			},
		},
		question: status === 'in_progress' ? mockSpellingQuestion : undefined,
	};
}

/**
 * Spelling happy path — mock Gateway BFF (AC-SP-03, AC-SP-04).
 */
test.describe('Games Hub — spelling playing mock', () => {
	let playStatus: 'in_progress' | 'completed' = 'in_progress';
	let lastAnswerBody: { spellingTileIds?: string[] } | null = null;

	test.beforeEach(async ({ page }) => {
		playStatus = 'in_progress';
		lastAnswerBody = null;

		await stubStudentPortalSession(page);

		await page.route('**/api/drill-ws/token**', async (route) => {
			await route.fulfill({ status: 404, body: '' });
		});

		await page.route(`**/api/learning-drill-runtime/plays/${MOCK_PLAY_ID}**`, async (route) => {
			const url = route.request().url();
			const method = route.request().method();

			if (method === 'POST' && url.endsWith('/answer')) {
				lastAnswerBody = route.request().postDataJSON() as { spellingTileIds?: string[] };
				playStatus = 'completed';
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						correct: true,
						completed: true,
						scoreInRun: 1,
						streak: 1,
						status: 'completed',
					}),
				});
				return;
			}

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(buildSpellingPlayPayload(playStatus)),
			});
		});
	});

	test('hiển thị stem + tiles và submit Xong gửi spellingTileIds', async ({ page }) => {
		await page.goto(`/learning/games/spelling/playing?playId=${MOCK_PLAY_ID}&classId=12`);

		await expect(page.getByText('con mèo')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Chữ c, kho chữ' })).toBeVisible();

		await page.getByRole('button', { name: 'Chữ c, kho chữ' }).click();
		await page.getByRole('button', { name: 'Chữ a, kho chữ' }).click();
		await page.getByRole('button', { name: 'Chữ t, kho chữ' }).click();

		await page.getByRole('button', { name: 'Xong' }).click();

		await expect(page).toHaveURL(/\/spelling\/result/, { timeout: 10_000 });
		expect(lastAnswerBody?.spellingTileIds).toEqual(['t-c', 't-a', 't-t']);
	});

	test('response mock không chứa targetWord (AC-SP-08)', async ({ page }) => {
		await page.goto(`/learning/games/spelling/playing?playId=${MOCK_PLAY_ID}&classId=12`);
		await expect(page.getByText('con mèo')).toBeVisible();
		expect(JSON.stringify(mockSpellingQuestion)).not.toContain('targetWord');
	});
});
