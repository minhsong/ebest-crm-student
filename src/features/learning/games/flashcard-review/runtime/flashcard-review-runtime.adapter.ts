import { authorizeFlashcardSession } from '@/lib/flashcard-authorize-client';
import {
	completeFlashcardSession,
	reviewFlashcardCard,
	startFlashcardSession,
} from '@/lib/learning-api';

/** HTTP adapter — flashcard session BFF, tách khỏi view. */
export const flashcardReviewRuntimeAdapter = {
	authorizeSession: authorizeFlashcardSession,
	startSession: startFlashcardSession,
	reviewCard: reviewFlashcardCard,
	completeSession: completeFlashcardSession,
} as const;
