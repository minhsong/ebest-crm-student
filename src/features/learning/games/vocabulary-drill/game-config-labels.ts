import {
	formatSpellingDifficultyLabel as formatSpellingDifficultyLabelEngine,
	formatVocabularyDrillPromptTypeLabel,
} from '@ebest/game-vocabulary-drill';
import type { SpellingDifficulty } from '@ebest/game-engine-core';
import type { GamePromptType } from '@/features/learning/games/catalog/game-catalog.types';

/** Lobby HV — nhãn ngắn từ engine SSOT. */
export function formatGamePromptTypeLabel(promptType: GamePromptType): string {
	return formatVocabularyDrillPromptTypeLabel(promptType, true);
}

export function formatSpellingDifficultyLabel(
	difficulty: SpellingDifficulty | null | undefined,
): string | null {
	return formatSpellingDifficultyLabelEngine(difficulty, true);
}
