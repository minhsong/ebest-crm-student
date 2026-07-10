import { describe, expect, it } from 'vitest';

import {
	FLASHCARD_AUTO_PLAY_ADVANCE_GAP_MS,
	FLASHCARD_AUTO_PLAY_GAP_MS,
	FLASHCARD_AUTO_PLAY_REPEATS,
} from '@/features/learning/games/flashcard-review/flashcard-auto-play.config';
import { resolveFlashcardAutoPlayAudioUrl } from '@/features/learning/games/flashcard-review/flashcard-auto-play.util';
import { resolvePreferredVocabularyAudio } from '@/features/learning/utils/vocabulary-display.util';

describe('flashcard auto play', () => {
	it('resolveFlashcardAutoPlayAudioUrl returns US only', () => {
		expect(
			resolveFlashcardAutoPlayAudioUrl({
				asset: { audioUsUrl: 'https://cdn/us.mp3', audioUkUrl: 'https://cdn/uk.mp3' },
			}),
		).toBe('https://cdn/us.mp3');
		expect(resolveFlashcardAutoPlayAudioUrl({ asset: {} })).toBeUndefined();
	});

	it('resolvePreferredVocabularyAudio prefers US then UK', () => {
		expect(
			resolvePreferredVocabularyAudio({
				audioUsUrl: 'https://cdn/us.mp3',
				audioUkUrl: 'https://cdn/uk.mp3',
			}),
		).toEqual({ locale: 'us', url: 'https://cdn/us.mp3' });
		expect(
			resolvePreferredVocabularyAudio({
				audioUkUrl: 'https://cdn/uk.mp3',
			}),
		).toEqual({ locale: 'uk', url: 'https://cdn/uk.mp3' });
	});

	it('constants match product spec', () => {
		expect(FLASHCARD_AUTO_PLAY_REPEATS).toBe(3);
		expect(FLASHCARD_AUTO_PLAY_GAP_MS).toBe(3000);
		expect(FLASHCARD_AUTO_PLAY_ADVANCE_GAP_MS).toBe(5000);
	});
});
