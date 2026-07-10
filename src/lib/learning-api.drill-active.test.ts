import { describe, expect, it, vi } from 'vitest';

import {
	DRILL_PLAY_ID_RE,
	fetchActiveDrillPlay,
	isDrillPlayId,
} from '@/lib/learning-api';

const VALID_PLAY_ID = '00000000-0000-4000-8000-000000000001';

describe('isDrillPlayId', () => {
	it('accepts UUID v4', () => {
		expect(isDrillPlayId(VALID_PLAY_ID)).toBe(true);
		expect(DRILL_PLAY_ID_RE.test(VALID_PLAY_ID)).toBe(true);
	});

	it('rejects invalid ids', () => {
		expect(isDrillPlayId('active')).toBe(false);
		expect(isDrillPlayId(undefined)).toBe(false);
		expect(isDrillPlayId('')).toBe(false);
	});
});

describe('fetchActiveDrillPlay', () => {
	it('returns null for empty JSON body', async () => {
		const fetchMock = vi.fn().mockResolvedValue({
			status: 200,
			ok: true,
			json: async () => ({}),
		});
		vi.stubGlobal('fetch', fetchMock);

		const result = await fetchActiveDrillPlay(12, 'meaning_to_word');
		expect(result).toBeNull();
	});

	it('returns null for null body', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				status: 200,
				ok: true,
				json: async () => null,
			}),
		);

		const result = await fetchActiveDrillPlay(12, 'meaning_to_word');
		expect(result).toBeNull();
	});

	it('parses valid in_progress payload', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				status: 200,
				ok: true,
				json: async () => ({
					playId: VALID_PLAY_ID,
					classId: 12,
					assignmentId: null,
					modeId: 'survival',
					promptType: 'meaning_to_word',
					scoreInRun: 2,
					status: 'in_progress',
					startedAt: '2026-01-01T00:00:00.000Z',
				}),
			}),
		);

		const result = await fetchActiveDrillPlay(12, 'meaning_to_word');
		expect(result?.playId).toBe(VALID_PLAY_ID);
	});
});
