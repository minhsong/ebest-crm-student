import { describe, expect, it } from 'vitest';

import { isInternalGameNavigationHref } from '@/features/learning/games/session/game-exit-guard.context';

describe('isInternalGameNavigationHref', () => {
	it('accepts relative paths', () => {
		expect(isInternalGameNavigationHref('/learning/games')).toBe(true);
	});

	it('rejects hash and external', () => {
		expect(isInternalGameNavigationHref('#section')).toBe(false);
		expect(isInternalGameNavigationHref('https://example.com')).toBe(false);
	});
});
