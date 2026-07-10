import type { FlashcardSessionCard, LearningVocabularyItem } from '@/types/learning';

export function remapCardOrder(items: LearningVocabularyItem[]): LearningVocabularyItem[] {
	return items.map((item, i) => ({ ...item, order: i + 1 }));
}

export function mapFlashcardCardToVocabularyItem(
	card: FlashcardSessionCard,
	order: number,
): LearningVocabularyItem {
	return {
		order,
		asset: {
			id: card.assetId,
			assetType: 'vocabulary',
			word: card.word,
			partOfSpeech: card.partOfSpeech,
			partOfSpeechLabel: card.partOfSpeechLabel,
			translation: card.meaning,
			ipaUk: card.ipaUk,
			ipaUs: card.ipaUs,
			example: card.example,
			exampleTranslation: card.exampleTranslation,
			audioUkUrl: card.audioUkUrl,
			audioUsUrl: card.audioUsUrl,
			imageUrl: card.imageUrl,
			status: 'published',
		},
		progress: {
			assetId: card.assetId,
			masteryState: 'new',
			masteryLabel: 'Mới',
			firstSeenAt: null,
			lastSeenAt: null,
			timesSeen: 0,
			knownCount: 0,
			unknownCount: 0,
			accuracyRate: null,
			lastQuizAt: null,
		},
	};
}

export function resolveFlashcardProgressPercent(
	index: number,
	total: number,
	phase: 'card' | 'done' | 'loading' | 'error',
): number {
	if (total <= 0) return 0;
	return Math.round(((index + (phase === 'done' ? 1 : 0)) / total) * 100);
}
