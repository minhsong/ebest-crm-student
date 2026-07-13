import { describe, expect, it } from 'vitest';

import {
	defaultVocabularyDrillSelection,
	resolveVocabularyDrillSelection,
	selectionFromVocabularyDrillSessionConfig,
} from './vocabulary-drill-pool.service';
import type { GameSessionConfig } from '@/features/learning/games/core/types/game-session-config.types';

describe('vocabulary-drill-pool.service — spelling', () => {
	it('free practice slug spelling giữ spellingDifficulty từ selection', () => {
		const selection = {
			...defaultVocabularyDrillSelection(),
			spellingDifficulty: 'medium' as const,
		};
		const resolved = resolveVocabularyDrillSelection({
			selection,
			assignmentCtx: null,
			promptTypeFromSlug: 'spelling',
		});
		expect(resolved.promptType).toBe('spelling');
		expect(resolved.spellingDifficulty).toBe('medium');
	});

	it('free practice spelling mặc định easy khi chưa chọn', () => {
		const resolved = resolveVocabularyDrillSelection({
			selection: defaultVocabularyDrillSelection(),
			assignmentCtx: null,
			promptTypeFromSlug: 'spelling',
		});
		expect(resolved.spellingDifficulty).toBe('easy');
	});

	it('assignment ctx không ghi đè mode/prompt từ GV', () => {
		const resolved = resolveVocabularyDrillSelection({
			selection: defaultVocabularyDrillSelection(),
			assignmentCtx: {
				assignmentId: 1,
				classId: 12,
				title: 'Spelling test',
				modeId: 'survival',
				promptType: 'spelling',
				spellingDifficulty: 'hard',
				minimumScore: 10,
				assignmentPoolSize: 20,
				unlockPoolSize: 20,
				bestScore: 0,
				assignmentComplete: false,
				canPlay: true,
			},
			promptTypeFromSlug: 'meaning_to_word',
		});
		expect(resolved.promptType).toBe('spelling');
		expect(resolved.modeId).toBe('survival');
		expect(resolved.spellingDifficulty).toBe('hard');
	});

	it('selectionFromVocabularyDrillSessionConfig đồng bộ checklist prefetch', () => {
		const sessionConfig = {
			gameFamily: 'vocabulary_drill',
			modeId: 'pool_coverage',
			promptType: 'spelling',
			rules: {
				answerTimeoutSec: 20,
				spellingDifficulty: 'medium',
				allowRetrySameItem: false,
			},
			scoring: {
				strategyId: 'accuracy_ratio',
				pointsPerCorrect: 1,
			},
			completion: {
				sessionPolicyId: 'end_on_pool_exhausted',
				syncAssignmentOn: 'never',
			},
			source: { kind: 'vocabulary_pool', itemIds: [], batchSize: 12 },
			presentation: {
				coreLayoutProfileId: 'x',
				modeLayoutProfileId: 'y',
				detailWidgetId: 'z',
			},
		} as GameSessionConfig;
		const selection = selectionFromVocabularyDrillSessionConfig(sessionConfig);
		expect(selection.modeId).toBe('pool_coverage');
		expect(selection.promptType).toBe('spelling');
		expect(selection.spellingDifficulty).toBe('medium');
	});
});
