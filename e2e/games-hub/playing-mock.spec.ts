import { expect, test } from '@playwright/test';

import { stubStudentPortalSession } from '../fixtures/student-session';

const MOCK_PLAY_ID = '00000000-0000-4000-8000-000000000001';

const mockQuestion = {
	questionId: 'q1',
	prompt: 'một',
	promptType: 'meaning',
	options: [
		{ id: 'a', label: 'one', assetId: 1 },
		{ id: 'b', label: 'two', assetId: 2 },
		{ id: 'c', label: 'three', assetId: 3 },
		{ id: 'd', label: 'four', assetId: 4 },
	],
};

function buildPlayPayload(status: 'in_progress' | 'completed', scoreInRun = 0) {
	return {
		playId: MOCK_PLAY_ID,
		classId: 12,
		assignmentId: null,
		modeId: 'survival',
		promptType: 'meaning_to_word',
		scoreInRun,
		streak: 0,
		status,
		sessionConfig: {
			gameFamily: 'vocabulary_drill',
			modeId: 'survival',
			promptType: 'meaning_to_word',
			presentation: {
				modeLayoutProfileId: 'survival_streak',
				detailWidgetId: 'meaning_mcq',
				resultProfileId: 'survival_result',
			},
			rules: {
				answerTimeoutSec: 10,
				optionCount: 4,
				allowRetrySameItem: false,
			},
		},
		question: status === 'in_progress' ? mockQuestion : undefined,
	};
}

/**
 * E12 — playing / result / abandon với mock Gateway BFF (không cần CRM/Gateway thật).
 */
test.describe('Games Hub — playing mock', () => {
	let playStatus: 'in_progress' | 'completed' = 'in_progress';
	let scoreInRun = 0;

	test.beforeEach(async ({ page }) => {
		playStatus = 'in_progress';
		scoreInRun = 0;

		await stubStudentPortalSession(page);

		await page.route('**/api/drill-ws/token**', async (route) => {
			await route.fulfill({ status: 404, body: '' });
		});

		await page.route(`**/api/learning-drill-runtime/plays/${MOCK_PLAY_ID}**`, async (route) => {
			const url = route.request().url();
			const method = route.request().method();

			if (method === 'POST' && url.endsWith('/abandon')) {
				playStatus = 'completed';
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({ completed: true, status: 'completed', scoreInRun }),
				});
				return;
			}

			if (method === 'POST' && url.endsWith('/answer')) {
				playStatus = 'completed';
				scoreInRun = 0;
				await route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: JSON.stringify({
						correct: false,
						completed: true,
						scoreInRun,
						streak: 0,
						status: 'completed',
					}),
				});
				return;
			}

			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify(buildPlayPayload(playStatus, scoreInRun)),
			});
		});
	});

	test('T2 playing hiển thị câu hỏi và nút Thoát', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/playing?playId=${MOCK_PLAY_ID}&classId=12`,
		);
		await expect(page.getByRole('button', { name: /Thoát/i })).toBeVisible();
		await expect(page.getByText('một')).toBeVisible();
		await expect(page.getByRole('button', { name: 'one' })).toBeVisible();
	});

	test('T3 trả lời sai — chuyển sang result', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/playing?playId=${MOCK_PLAY_ID}&classId=12`,
		);
		await expect(page.getByText('một')).toBeVisible();
		await page.getByRole('button', { name: 'two' }).click();
		await expect(page).toHaveURL(/\/meaning-to-word\/result/, { timeout: 10_000 });
	});

	test('T4 result + in_progress — tiếp tục chơi', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/result?playId=${MOCK_PLAY_ID}&classId=12`,
		);
		const continueDialog = page
			.getByRole('dialog')
			.filter({ hasText: 'Lượt chơi chưa kết thúc' });
		await expect(continueDialog).toBeVisible();
		await continueDialog.getByRole('button', { name: 'Tiếp tục chơi' }).click();
		await expect(page).toHaveURL(/\/playing/, { timeout: 10_000 });
		await expect(page.getByText('một')).toBeVisible();
	});

	test('T5 result + in_progress — kết thúc lượt', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/result?playId=${MOCK_PLAY_ID}&classId=12`,
		);
		await expect(page.getByText('Lượt chơi chưa kết thúc')).toBeVisible();
		await page.getByRole('button', { name: 'Kết thúc lượt' }).click();
		await expect(page).toHaveURL(/\/result/);
		await expect(page.getByText('Lượt chơi chưa kết thúc')).not.toBeVisible();
	});

	test('T9 click sidebar khi playing — hiện modal xác nhận', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/playing?playId=${MOCK_PLAY_ID}&classId=12`,
		);
		await expect(page.getByText('một')).toBeVisible();

		await page.getByRole('menuitem', { name: 'home Tổng quan' }).click();

		const exitDialog = page.getByRole('dialog').filter({ hasText: 'Kết thúc lượt chơi?' });
		await expect(exitDialog).toBeVisible();
		await exitDialog.getByRole('button', { name: 'Tiếp tục chơi' }).click();
		await expect(page).toHaveURL(/\/playing/);
	});

	test('T10 HUD Thoát — xác nhận abandon', async ({ page }) => {
		await page.goto(
			`/learning/games/meaning-to-word/playing?playId=${MOCK_PLAY_ID}&classId=12`,
		);
		await expect(page.getByText('một')).toBeVisible();

		await page.getByRole('button', { name: /Thoát/i }).click();
		const exitDialog = page.getByRole('dialog').filter({ hasText: 'Kết thúc lượt chơi?' });
		await expect(exitDialog).toBeVisible();
		await exitDialog.getByRole('button', { name: 'Kết thúc lượt' }).click();
		await expect(page).not.toHaveURL(/\/playing/, { timeout: 10_000 });
	});
});
