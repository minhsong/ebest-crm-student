import { describe, expect, it } from 'vitest';

import {
	buildGameReadyHrefForAssignment,
	resolveGameSlugRedirect,
} from '@/features/learning/games/session/game-assignment-route.utils';

describe('game-assignment-route.utils', () => {
	it('builds ready href for audio assignment', () => {
		const href = buildGameReadyHrefForAssignment(12, 5, 'audio_to_word');
		expect(href).toContain('/audio-to-word/ready');
		expect(href).toContain('assignmentId=5');
	});

	it('redirects wrong slug for assignment promptType', () => {
		const href = resolveGameSlugRedirect(
			'meaning-to-word',
			'audio_to_word',
			{ classId: 12, assignmentId: 3 },
			'ready',
		);
		expect(href).toContain('/audio-to-word/ready');
	});

	it('returns null when slug matches', () => {
		expect(
			resolveGameSlugRedirect(
				'meaning-to-word',
				'meaning_to_word',
				{ classId: 12 },
				'ready',
			),
		).toBeNull();
	});
});
