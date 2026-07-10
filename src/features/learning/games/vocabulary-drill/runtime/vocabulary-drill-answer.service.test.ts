import { describe, expect, it } from 'vitest';

import {
	planVocabularyDrillAnswerHandling,
	resolvePoolCoverageRunPassed,
	resolveRunPassedFromResume,
	resolveSurvivalRunPassed,
} from '@/features/learning/games/vocabulary-drill/runtime/vocabulary-drill-answer.service';
import type { DrillAnswerResult } from '@/types/learning';

const progress = { answered: 5, total: 10, correct: 4, wrong: 1 };

describe('planVocabularyDrillAnswerHandling', () => {
	it('survival wrong → finish fail', () => {
		expect(
			planVocabularyDrillAnswerHandling('survival', {
				correct: false,
				completed: true,
				scoreInRun: 2,
			} as DrillAnswerResult),
		).toEqual({ kind: 'feedback_then_finish_survival_fail' });
	});

	it('survival pass threshold → finish pass', () => {
		const result = {
			correct: true,
			completed: true,
			scoreInRun: 15,
		} as DrillAnswerResult;
		expect(planVocabularyDrillAnswerHandling('survival', result)).toEqual({
			kind: 'feedback_then_finish_survival_pass',
			result,
		});
	});

	it('pool completed → finish pool', () => {
		expect(
			planVocabularyDrillAnswerHandling('pool_coverage', {
				correct: true,
				completed: true,
				scoreInRun: 4,
				progress,
			} as DrillAnswerResult),
		).toEqual({
			kind: 'feedback_then_finish_pool',
			correct: true,
			progress,
		});
	});

	it('speed_run wrong in progress → continue', () => {
		expect(
			planVocabularyDrillAnswerHandling('speed_run', {
				correct: false,
				completed: false,
				scoreInRun: 1,
				progress,
				nextQuestion: { questionId: 'q2' },
			} as DrillAnswerResult),
		).toEqual({
			kind: 'feedback_then_continue',
			correct: false,
			progress,
			nextQuestion: { questionId: 'q2' },
			resetStreak: true,
		});
	});
});

describe('resolveRunPassed helpers', () => {
	it('pool coverage uses minimum score', () => {
		expect(resolvePoolCoverageRunPassed(progress, 5)).toBe(false);
		expect(resolvePoolCoverageRunPassed(progress, 4)).toBe(true);
	});

	it('survival uses score threshold', () => {
		expect(resolveSurvivalRunPassed(14, 15)).toBe(false);
		expect(resolveSurvivalRunPassed(15, 15)).toBe(true);
	});

	it('resume prefers explicit runPassed', () => {
		expect(
			resolveRunPassedFromResume({
				modeId: 'survival',
				runPassed: true,
				lastAnswerCorrect: false,
			}),
		).toBe(true);
	});
});
