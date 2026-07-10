import { VOCABULARY_DRILL_GAME_FAMILY } from '@ebest/game-vocabulary-drill';

import { flashcardReviewRuntimeAdapter } from '@/features/learning/games/flashcard-review/runtime/flashcard-review-runtime.adapter';
import { vocabularyDrillRuntimeAdapter } from '@/features/learning/games/vocabulary-drill/runtime/vocabulary-drill-runtime.adapter';

export type VocabularyDrillRuntimeAdapter = typeof vocabularyDrillRuntimeAdapter;
export type FlashcardReviewRuntimeAdapter = typeof flashcardReviewRuntimeAdapter;
export type GameRuntimeAdapter = VocabularyDrillRuntimeAdapter | FlashcardReviewRuntimeAdapter;

const RUNTIME_BY_FAMILY: Record<string, GameRuntimeAdapter> = {
	[VOCABULARY_DRILL_GAME_FAMILY]: vocabularyDrillRuntimeAdapter,
	flashcard_review: flashcardReviewRuntimeAdapter,
};

/** Resolve HTTP/WS adapter theo `gameFamily` — mở rộng game mới chỉ đăng ký tại đây. */
export function getGameRuntimeAdapter(
	gameFamily: string | null | undefined,
): GameRuntimeAdapter | null {
	if (!gameFamily) return null;
	return RUNTIME_BY_FAMILY[gameFamily] ?? null;
}

export function getVocabularyDrillRuntimeAdapter(): VocabularyDrillRuntimeAdapter {
	return vocabularyDrillRuntimeAdapter;
}

export function getFlashcardReviewRuntimeAdapter(): FlashcardReviewRuntimeAdapter {
	return flashcardReviewRuntimeAdapter;
}
