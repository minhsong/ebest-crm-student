import { describe, expect, it } from 'vitest';

import { resolveLegacyGamesRedirectHref } from '@/features/learning/games/session/legacy-games-redirect.utils';

describe('resolveLegacyGamesRedirectHref', () => {
	it('T11 legacy classId redirects to meaning-to-word ready', () => {
		expect(resolveLegacyGamesRedirectHref({ classId: '12' })).toBe(
			'/learning/games/meaning-to-word/ready?classId=12&modeId=survival',
		);
	});

	it('legacy assignment query preserves assignmentId', () => {
		const href = resolveLegacyGamesRedirectHref({
			classId: '12',
			assignmentId: '99',
		});
		expect(href).toContain('/ready');
		expect(href).toContain('assignmentId=99');
	});

	it('empty query falls back to catalog', () => {
		expect(resolveLegacyGamesRedirectHref({})).toBe('/learning/games');
	});
});
