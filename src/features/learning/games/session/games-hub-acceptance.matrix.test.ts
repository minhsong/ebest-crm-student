import { describe, expect, it } from 'vitest';

import { isValidGameSlug } from '@/features/learning/games/catalog/game-catalog.registry';
import { buildGameReadyHrefForAssignment } from '@/features/learning/games/session/game-assignment-route.utils';
import { reconcileGameRoute } from '@/features/learning/games/session/game-route-reconcile.utils';
import {
	buildGamePlayingHref,
	buildGameReadyHref,
	buildGameResultHref,
	buildGameRouteForPlay,
} from '@/features/learning/games/session/game-route.utils';
import { resolveLegacyGamesRedirectHref } from '@/features/learning/games/session/legacy-games-redirect.utils';
import type { DrillSessionResumePayload } from '@/types/learning';

const playId = '00000000-0000-4000-8000-000000000099';

const inProgressPlay: DrillSessionResumePayload = {
	playId,
	classId: 12,
	assignmentId: null,
	modeId: 'survival',
	promptType: 'meaning_to_word',
	scoreInRun: 3,
	streak: 1,
	status: 'in_progress',
	sessionConfig: null,
};

/**
 * Ma trận §10.2 GAMES_HUB_IMPLEMENTATION_PLAN — logic thuần (không browser).
 * Browser scenarios: e2e/games-hub/*.spec.ts
 */
describe('Games Hub acceptance matrix (vitest)', () => {
	it('T1 catalog → ready href', () => {
		expect(buildGameReadyHref('meaning-to-word', { classId: 12, modeId: 'survival' })).toContain(
			'/ready',
		);
	});

	it('T2 reload playing — reconcile match in_progress', () => {
		expect(
			reconcileGameRoute({
				gameSlug: 'meaning-to-word',
				urlSegment: 'playing',
				playId,
				classId: 12,
				play: inProgressPlay,
			}),
		).toEqual({ kind: 'match' });
	});

	it('T3 complete → result URL segment', () => {
		const href = buildGameRouteForPlay('meaning_to_word', 'completed', {
			playId,
			classId: 12,
		});
		expect(href).toContain('/result');
		expect(href).toContain(playId);
	});

	it('T4 result URL + in_progress API → confirm continue', () => {
		expect(
			reconcileGameRoute({
				gameSlug: 'meaning-to-word',
				urlSegment: 'result',
				playId,
				classId: 12,
				play: inProgressPlay,
			}),
		).toEqual({ kind: 'confirm_continue' });
	});

	it('T5 result URL — abandon path uses same playId on playing', () => {
		const playingHref = buildGamePlayingHref('meaning-to-word', {
			playId,
			classId: 12,
		});
		expect(playingHref).toContain(playId);
		expect(playingHref).toContain('/playing');
	});

	it('T6 wrong slug invalid', () => {
		expect(isValidGameSlug('not-a-game')).toBe(false);
	});

	it('T7 assignment deep link via assignment helper', () => {
		const href = buildGameReadyHrefForAssignment(12, 99, 'audio_to_word');
		expect(href).toContain('/audio-to-word/ready');
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

	it('T9 exit guard — enabled only on playing segment (contract)', () => {
		const playing = buildGamePlayingHref('meaning-to-word', { playId, classId: 12 });
		const ready = buildGameReadyHref('meaning-to-word', { classId: 12 });
		expect(playing).toContain('/playing');
		expect(ready).not.toContain('/playing');
	});

	it('T10 abandon — result after completed maps to result href', () => {
		const href = buildGameResultHref('meaning-to-word', { playId, classId: 12 });
		expect(href).toContain('/result');
	});

	it('T11 legacy classId + playId redirect', () => {
		const legacy = resolveLegacyGamesRedirectHref({ classId: '12', playId });
		expect(legacy).toContain('/playing');
		expect(legacy).toContain(playId);
	});
});
