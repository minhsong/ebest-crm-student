import { describe, expect, it } from 'vitest';

import {
	mapFlashcardCardToVocabularyItem,
	resolveFlashcardProgressPercent,
} from '@/features/learning/games/flashcard-review/runtime/flashcard-session.service';

describe('flashcard-session.service', () => {
	it('mapFlashcardCardToVocabularyItem maps wire card', () => {
		const item = mapFlashcardCardToVocabularyItem(
			{
				assetId: 5,
				word: 'hello',
				meaning: 'xin chào',
			} as Parameters<typeof mapFlashcardCardToVocabularyItem>[0],
			2,
		);
		expect(item.order).toBe(2);
		expect(item.asset.word).toBe('hello');
		expect(item.asset.id).toBe(5);
	});

	it('resolveFlashcardProgressPercent at mid session', () => {
		expect(resolveFlashcardProgressPercent(2, 10, 'card')).toBe(20);
		expect(resolveFlashcardProgressPercent(9, 10, 'done')).toBe(100);
	});
});
