import { describe, expect, it } from 'vitest';

import { reconcileGameRoute } from '@/features/learning/games/session/game-route-reconcile.utils';
import type { DrillSessionResumePayload } from '@/types/learning';

const basePlay: DrillSessionResumePayload = {
	playId: '00000000-0000-4000-8000-000000000001',
	classId: 12,
	assignmentId: null,
	modeId: 'survival',
	promptType: 'meaning_to_word',
	scoreInRun: 3,
	streak: 1,
	status: 'in_progress',
	sessionConfig: null,
};

describe('reconcileGameRoute', () => {
	it('matches playing + in_progress', () => {
		expect(
			reconcileGameRoute({
				gameSlug: 'meaning-to-word',
				urlSegment: 'playing',
				playId: basePlay.playId,
				classId: 12,
				play: basePlay,
			}),
		).toEqual({ kind: 'match' });
	});

	it('redirects playing to result when completed', () => {
		const outcome = reconcileGameRoute({
			gameSlug: 'meaning-to-word',
			urlSegment: 'playing',
			playId: basePlay.playId,
			classId: 12,
			play: { ...basePlay, status: 'completed' },
		});
		expect(outcome.kind).toBe('redirect');
		if (outcome.kind === 'redirect') {
			expect(outcome.href).toContain('/result');
		}
	});

	it('confirms continue on result when still in progress', () => {
		expect(
			reconcileGameRoute({
				gameSlug: 'meaning-to-word',
				urlSegment: 'result',
				playId: basePlay.playId,
				classId: 12,
				play: basePlay,
			}),
		).toEqual({ kind: 'confirm_continue' });
	});

	it('redirects wrong game slug to correct promptType', () => {
		const outcome = reconcileGameRoute({
			gameSlug: 'audio-to-word',
			urlSegment: 'playing',
			playId: basePlay.playId,
			classId: 12,
			play: basePlay,
		});
		expect(outcome.kind).toBe('redirect');
		if (outcome.kind === 'redirect') {
			expect(outcome.href).toContain('/meaning-to-word/playing');
		}
	});

	it('redirects ready with completed playId to result', () => {
		const outcome = reconcileGameRoute({
			gameSlug: 'meaning-to-word',
			urlSegment: 'ready',
			playId: basePlay.playId,
			classId: 12,
			play: { ...basePlay, status: 'completed' },
		});
		expect(outcome.kind).toBe('redirect');
		if (outcome.kind === 'redirect') {
			expect(outcome.href).toContain('/result');
		}
	});

	it('confirms continue on ready when in_progress with playId', () => {
		expect(
			reconcileGameRoute({
				gameSlug: 'meaning-to-word',
				urlSegment: 'ready',
				playId: basePlay.playId,
				classId: 12,
				play: basePlay,
			}),
		).toEqual({ kind: 'confirm_continue' });
	});

	it('invalid when playing segment missing playId', () => {
		expect(
			reconcileGameRoute({
				gameSlug: 'meaning-to-word',
				urlSegment: 'playing',
				playId: null,
				classId: 12,
				play: null,
			}),
		).toEqual({ kind: 'invalid', reason: 'missing_play_id' });
	});

	it('redirects playing without play payload to ready', () => {
		const outcome = reconcileGameRoute({
			gameSlug: 'meaning-to-word',
			urlSegment: 'playing',
			playId: basePlay.playId,
			classId: 12,
			play: null,
		});
		expect(outcome.kind).toBe('redirect');
		if (outcome.kind === 'redirect') {
			expect(outcome.href).toContain('/ready');
		}
	});

	it('enriches URL when classId missing but play has classId', () => {
		const outcome = reconcileGameRoute({
			gameSlug: 'meaning-to-word',
			urlSegment: 'playing',
			playId: basePlay.playId,
			classId: null,
			play: basePlay,
		});
		expect(outcome.kind).toBe('redirect');
		if (outcome.kind === 'redirect') {
			expect(outcome.href).toContain('classId=12');
		}
	});
});
