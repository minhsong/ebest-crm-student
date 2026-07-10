import { describe, expect, it } from 'vitest';

import { DEFAULT_GAME_SLUG } from '@/features/learning/games/catalog/game-catalog.registry';
import {
	buildGameReadyHref,
	resolveLegacyGamesUrl,
} from '@/features/learning/games/session/game-route.utils';

describe('resolveLegacyGamesUrl', () => {
	it('returns null without legacy params', () => {
		expect(resolveLegacyGamesUrl(new URLSearchParams())).toBeNull();
	});

	it('redirects classId to default game ready', () => {
		const href = resolveLegacyGamesUrl(new URLSearchParams('classId=12'));
		expect(href).toBe(buildGameReadyHref(DEFAULT_GAME_SLUG, { classId: 12, modeId: 'survival' }));
	});

	it('serializes pool_coverage as best_of in URL', () => {
		const href = buildGameReadyHref(DEFAULT_GAME_SLUG, {
			classId: 12,
			modeId: 'pool_coverage',
		});
		expect(href).toContain('modeId=best_of');
	});

	it('parses best_of legacy query', () => {
		const href = resolveLegacyGamesUrl(
			new URLSearchParams('classId=12&modeId=best_of'),
		);
		expect(href).toContain('modeId=best_of');
	});

	it('redirects playId to playing route', () => {
		const href = resolveLegacyGamesUrl(
			new URLSearchParams('classId=12&playId=00000000-0000-4000-8000-000000000001'),
		);
		expect(href).toContain('/playing');
		expect(href).toContain('playId=');
	});
});
