import { describe, expect, it } from 'vitest';

import { buildGameRouteForPlay, buildGameReadyHref } from '@/features/learning/games/session/game-route.utils';

/**
 * Ma trận flow §10.2 GAMES_HUB_IMPLEMENTATION_PLAN — pure URL scenarios.
 */
describe('games hub flow URLs', () => {
	it('T1 catalog → ready default', () => {
		const href = buildGameReadyHref('meaning-to-word', { classId: 12, modeId: 'survival' });
		expect(href).toBe('/learning/games/meaning-to-word/ready?classId=12&modeId=survival');
	});

	it('T7 assignment deep link', () => {
		const href = buildGameReadyHref('meaning-to-word', {
			classId: 12,
			assignmentId: 99,
		});
		expect(href).toContain('/ready');
		expect(href).toContain('assignmentId=99');
	});

	it('T8 checklist deep link', () => {
		const href = buildGameReadyHref('meaning-to-word', {
			classId: 12,
			checklistId: 7,
			modeId: 'pool_coverage',
		});
		expect(href).toContain('checklistId=7');
		expect(href).toContain('modeId=best_of');
	});

	it('T11 legacy play routes to correct segment', () => {
		const playing = buildGameRouteForPlay('meaning_to_word', 'in_progress', {
			playId: '00000000-0000-4000-8000-000000000099',
			classId: 12,
		});
		expect(playing).toContain('/playing');
		expect(playing).toContain('playId=');

		const result = buildGameRouteForPlay('audio_to_word', 'completed', {
			playId: '00000000-0000-4000-8000-000000000099',
			classId: 12,
		});
		expect(result).toContain('/audio-to-word/result');
	});
});
