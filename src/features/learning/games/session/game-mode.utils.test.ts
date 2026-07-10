import { describe, expect, it } from 'vitest';

import {
	modeIdFromUrlParam,
	modeIdToUrlParam,
	normalizeModeIdForApi,
} from '@/features/learning/games/session/game-mode.utils';

describe('game-mode.utils', () => {
	it('maps best_of ↔ pool_coverage', () => {
		expect(modeIdFromUrlParam('best_of')).toBe('pool_coverage');
		expect(modeIdToUrlParam('pool_coverage')).toBe('best_of');
	});

	it('keeps survival round-trip', () => {
		expect(modeIdFromUrlParam('survival')).toBe('survival');
		expect(modeIdToUrlParam('survival')).toBe('survival');
	});

	it('keeps speed_run round-trip', () => {
		expect(modeIdFromUrlParam('speed_run')).toBe('speed_run');
		expect(modeIdToUrlParam('speed_run')).toBe('speed_run');
	});

	it('defaults unknown to survival for API', () => {
		expect(normalizeModeIdForApi('unknown')).toBe('survival');
		expect(normalizeModeIdForApi(null)).toBe('survival');
	});
});
