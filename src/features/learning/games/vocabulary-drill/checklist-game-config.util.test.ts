import { describe, expect, it } from 'vitest';

import {
	buildChecklistGameReadyHref,
	parseChecklistGameConfig,
} from './checklist-game-config.util';

const CHECKLIST_SPELLING_CONFIG = {
	modeId: 'pool_coverage',
	promptType: 'spelling',
	wordScopeMode: 'custom_selection',
	poolSlice: 'single_session',
	minimumScore: 4,
	selectedAssetIds: [1, 2, 3, 4],
	spellingDifficulty: 'hard',
} as const;

describe('checklist-game-config.util', () => {
	it('parse spelling gameConfig', () => {
		const parsed = parseChecklistGameConfig(CHECKLIST_SPELLING_CONFIG);
		expect(parsed?.promptType).toBe('spelling');
		expect(parsed?.spellingDifficulty).toBe('hard');
		expect(parsed?.selectedAssetIds).toHaveLength(4);
	});

	it('build href dùng slug spelling', () => {
		const href = buildChecklistGameReadyHref(12, 99, CHECKLIST_SPELLING_CONFIG);
		expect(href).toContain('/learning/games/spelling/ready');
		expect(href).toContain('checklistId=99');
		expect(href).toContain('classId=12');
	});
});
