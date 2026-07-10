/** Shared drill runtime mocks for Games Hub E2E. */

export const MOCK_DRILL_PLAY_ID = 'e2e-play-mock-shared';

export const mockDrillQuestion = {
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

export function buildMockDrillSessionConfig(overrides?: {
	modeId?: string;
	promptType?: string;
}) {
	return {
		gameFamily: 'vocabulary_drill',
		modeId: overrides?.modeId ?? 'survival',
		promptType: overrides?.promptType ?? 'meaning_to_word',
		presentation: {
			modeLayoutProfileId: 'survival_streak',
			detailWidgetId: 'meaning_mcq',
			resultProfileId: 'survival_result',
		},
		rules: {
			answerTimeoutSec: 15,
			optionCount: 4,
			allowRetrySameItem: false,
		},
	};
}

export function buildMockDrillAuthorizeSuccess(overrides?: {
	classId?: number;
	assignmentId?: number | null;
	checklistId?: number | null;
	modeId?: string;
	promptType?: string;
	minimumScore?: number;
	poolSize?: number;
}) {
	const classId = overrides?.classId ?? 12;
	const poolSize = overrides?.poolSize ?? 10;
	const assetIds = Array.from({ length: poolSize }, (_, i) => i + 1);

	return {
		allowed: true,
		classId,
		courseId: 1,
		assignmentId: overrides?.assignmentId ?? null,
		checklistId: overrides?.checklistId ?? null,
		modeId: overrides?.modeId ?? 'survival',
		promptType: overrides?.promptType ?? 'meaning_to_word',
		rules: {
			minimumScore: overrides?.minimumScore ?? 10,
			answerTimeoutSec: 15,
		},
		pool: {
			totalAssetIds: assetIds,
			batchSize: poolSize,
			firstBatch: assetIds.map((id) => ({
				assetId: id,
				word: `word-${id}`,
				meaning: `nghĩa-${id}`,
				tier: 'required' as const,
			})),
		},
		sessionConfig: buildMockDrillSessionConfig({
			modeId: overrides?.modeId,
			promptType: overrides?.promptType,
		}),
		progress: {
			bestScore: 0,
			minimumScore: overrides?.minimumScore ?? 10,
			playCount: 0,
			checked: false,
		},
	};
}

export function buildMockDrillPlayPayload(
	status: 'in_progress' | 'completed',
	scoreInRun = 0,
	overrides?: { assignmentId?: number | null; modeId?: string; promptType?: string },
) {
	return {
		playId: MOCK_DRILL_PLAY_ID,
		classId: 12,
		assignmentId: overrides?.assignmentId ?? null,
		modeId: overrides?.modeId ?? 'survival',
		promptType: overrides?.promptType ?? 'meaning_to_word',
		scoreInRun,
		streak: 0,
		status,
		sessionConfig: buildMockDrillSessionConfig({
			modeId: overrides?.modeId,
			promptType: overrides?.promptType,
		}),
		question: status === 'in_progress' ? mockDrillQuestion : undefined,
	};
}

export function buildMockDrillStartResponse(
	overrides?: { assignmentId?: number | null; modeId?: string; promptType?: string },
) {
	return {
		...buildMockDrillPlayPayload('in_progress', 0, overrides),
		question: mockDrillQuestion,
	};
}
