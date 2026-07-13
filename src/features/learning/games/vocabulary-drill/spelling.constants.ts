import type { SpellingDifficulty } from '@ebest/game-engine-core';
import type { GameTileOption } from '@/features/learning/games/catalog-ui/GameTilePicker';
import {
	formatSpellingDifficultyLobbyDescription,
	SPELLING_POOL_ELIGIBILITY_MESSAGE,
	VOCABULARY_DRILL_SPELLING_DIFFICULTY_SHORT_LABELS,
} from '@ebest/game-vocabulary-drill';

export { SPELLING_POOL_ELIGIBILITY_MESSAGE };

const SPELLING_DIFFICULTIES = ['easy', 'medium', 'hard'] as const satisfies readonly SpellingDifficulty[];

/** Lobby picker — SSOT labels từ `@ebest/game-vocabulary-drill`. */
export const PORTAL_SPELLING_DIFFICULTY_OPTIONS: GameTileOption<SpellingDifficulty>[] =
	SPELLING_DIFFICULTIES.map((difficulty) => ({
		value: difficulty,
		title: VOCABULARY_DRILL_SPELLING_DIFFICULTY_SHORT_LABELS[difficulty],
		description: formatSpellingDifficultyLobbyDescription(difficulty),
	}));

export const DEFAULT_SPELLING_DIFFICULTY: SpellingDifficulty = 'easy';
