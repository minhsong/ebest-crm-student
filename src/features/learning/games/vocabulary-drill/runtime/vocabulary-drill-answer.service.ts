import {
	VOCABULARY_DRILL_MODE_CATALOG,
	type VocabularyDrillModeId,
} from '@ebest/game-vocabulary-drill';

import type { DrillAnswerResult } from '@/types/learning';

export type PoolCoverageProgress = NonNullable<DrillAnswerResult['progress']>;

export type VocabularyDrillAnswerPlan =
	| {
			kind: 'feedback_then_finish_pool';
			correct: boolean;
			progress: PoolCoverageProgress;
	  }
	| { kind: 'feedback_then_finish_speed'; correct: boolean }
	| { kind: 'feedback_then_finish_survival_pass'; result: DrillAnswerResult }
	| { kind: 'feedback_then_finish_survival_fail' }
	| {
			kind: 'feedback_then_continue';
			correct: boolean;
			progress?: PoolCoverageProgress;
			nextQuestion?: DrillAnswerResult['nextQuestion'];
			resetStreak?: boolean;
			incrementStreak?: boolean;
	  };

function sessionPolicyId(modeId: VocabularyDrillModeId) {
	return VOCABULARY_DRILL_MODE_CATALOG[modeId].sessionPolicyId;
}

/** Map kết quả API → hành vi UI — SSOT theo `sessionPolicyId` trong catalog engine. */
export function planVocabularyDrillAnswerHandling(
	modeId: VocabularyDrillModeId,
	result: DrillAnswerResult,
): VocabularyDrillAnswerPlan {
	const policyId = sessionPolicyId(modeId);

	if (result.completed) {
		if (policyId === 'end_on_pool_exhausted' && result.progress) {
			return {
				kind: 'feedback_then_finish_pool',
				correct: result.correct,
				progress: result.progress,
			};
		}
		if (policyId === 'end_on_timer') {
			return { kind: 'feedback_then_finish_speed', correct: result.correct };
		}
		if (result.correct) {
			return { kind: 'feedback_then_finish_survival_pass', result };
		}
		return { kind: 'feedback_then_finish_survival_fail' };
	}

	if (
		!result.correct &&
		(policyId === 'end_on_pool_exhausted' || policyId === 'end_on_timer')
	) {
		return {
			kind: 'feedback_then_continue',
			correct: false,
			progress: result.progress,
			nextQuestion: result.nextQuestion,
			resetStreak: true,
		};
	}

	return {
		kind: 'feedback_then_continue',
		correct: true,
		progress: result.progress,
		nextQuestion: result.nextQuestion,
		incrementStreak: true,
	};
}

export function resolvePoolCoverageRunPassed(
	progress: PoolCoverageProgress,
	assignmentMinimumScore?: number,
): boolean {
	if (assignmentMinimumScore == null) {
		return progress.correct > 0;
	}
	return progress.correct >= assignmentMinimumScore;
}

export function resolveSurvivalRunPassed(
	scoreInRun: number,
	assignmentMinimumScore?: number,
): boolean {
	if (assignmentMinimumScore == null) {
		return true;
	}
	return scoreInRun >= assignmentMinimumScore;
}

export function resolveRunPassedFromResume(input: {
	modeId: VocabularyDrillModeId;
	lastAnswerCorrect?: boolean | null;
	runPassed?: boolean | null;
	progress?: PoolCoverageProgress | null;
	assignmentMinimumScore?: number;
}): boolean | null {
	if (input.runPassed != null) {
		return input.runPassed;
	}

	const policyId = sessionPolicyId(input.modeId);

	if (policyId === 'end_on_pool_exhausted' && input.progress) {
		return resolvePoolCoverageRunPassed(input.progress, input.assignmentMinimumScore);
	}

	if (policyId === 'end_on_wrong' && input.lastAnswerCorrect === false) {
		return false;
	}

	return null;
}
