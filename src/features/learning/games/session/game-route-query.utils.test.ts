import { describe, expect, it } from 'vitest';

import { parseGameRouteQuery } from '@/features/learning/games/session/game-route-query.utils';
import {
	getGameHubBackHref,
	getGameHubBackLabel,
} from '@/features/learning/games/session/game-hub-navigation.utils';

describe('parseGameRouteQuery', () => {
	it('parses numeric ids and playId', () => {
		const q = parseGameRouteQuery(
			new URLSearchParams('classId=12&assignmentId=3&checklistId=9&playId=abc&modeId=best_of'),
		);
		expect(q).toEqual({
			classId: 12,
			assignmentId: 3,
			checklistId: 9,
			playId: 'abc',
			modeIdParam: 'best_of',
			classSessionId: null,
		});
	});

	it('parses classSessionId', () => {
		const q = parseGameRouteQuery(
			new URLSearchParams('classId=12&classSessionId=55&modeId=best_of'),
		);
		expect(q.classSessionId).toBe(55);
	});

	it('returns null for invalid numbers', () => {
		const q = parseGameRouteQuery(new URLSearchParams('classId=bad'));
		expect(q.classId).toBeNull();
	});
});

describe('game-hub-navigation', () => {
	it('routes checklist to classes', () => {
		expect(getGameHubBackHref({ checklistId: 1 })).toBe('/classes');
		expect(getGameHubBackLabel({ checklistId: 1 })).toBe('Về checklist');
	});

	it('routes assignment to assignments list', () => {
		expect(getGameHubBackHref({ assignmentId: 2 })).toContain('/assignments');
	});
});
