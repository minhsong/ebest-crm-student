import type { GamePromptType } from '@/features/learning/games/catalog/game-catalog.types';
import type { DrillStartAuthorizeContext } from '@/lib/drill-authorize-client';
import type { AssignmentDrillContextPayload } from '@/types/learning';
import type { SpellingDifficulty } from '@ebest/game-engine-core';

/** VM checklist penalty — dùng chung ready/legacy. */
export function buildChecklistLobbyContext(
	checklistId: number | null,
	classId: number | null,
	authorizeContext: DrillStartAuthorizeContext | null,
	promptType: GamePromptType,
	spellingDifficulty?: SpellingDifficulty | null,
): AssignmentDrillContextPayload | null {
	if (!checklistId || !classId || !authorizeContext?.rules) {
		return null;
	}

	const rawMinimum = authorizeContext.rules.minimumScore;
	if (rawMinimum == null || !Number.isFinite(rawMinimum)) {
		return null;
	}

	const minimumScore = Math.floor(rawMinimum);
	const poolSize =
		authorizeContext.pool?.batchSize ??
		authorizeContext.pool?.totalAssetIds?.length ??
		0;

	return {
		assignmentId: 0,
		classId: authorizeContext.classId,
		title: 'Nhiệm vụ phạt chơi game',
		minimumScore,
		modeId: 'pool_coverage',
		promptType,
		...(promptType === 'spelling' && spellingDifficulty
			? { spellingDifficulty }
			: {}),
		assignmentPoolSize: poolSize,
		unlockPoolSize: poolSize,
		bestScore: authorizeContext.progress?.bestScore ?? 0,
		bestTotal: poolSize,
		assignmentComplete: authorizeContext.progress?.checked ?? false,
		canPlay: poolSize > 0,
		contextKind: 'checklist_penalty',
	};
}
