export type {
	VocabularyDrillModeId,
	VocabularyDrillPromptType,
	SpellingDifficulty,
} from '@ebest/game-engine-core';

import type { GamePromptType } from '@/features/learning/games/catalog/game-catalog.types';
import type { SpellingDifficulty, VocabularyDrillModeId } from '@ebest/game-engine-core';

/** Selection lobby / authorize — SSOT Portal drill. */
export type DrillPracticeSelection = {
	modeId: VocabularyDrillModeId;
	promptType: GamePromptType;
	sessionDurationSec?: 60 | 90 | 120;
	spellingDifficulty?: SpellingDifficulty;
};
