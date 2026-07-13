'use client';

import type { DrillPracticeSelection } from '@/features/learning/games/core/types/game-drill-shared.types';
import { GameTilePicker } from '@/features/learning/games/catalog-ui/GameTilePicker';
import {
	DEFAULT_SPELLING_DIFFICULTY,
	PORTAL_SPELLING_DIFFICULTY_OPTIONS,
} from '@/features/learning/games/vocabulary-drill/spelling.constants';

type Props = {
	selection: DrillPracticeSelection;
	onDifficultyChange: (difficulty: DrillPracticeSelection['spellingDifficulty']) => void;
};

export function GameSpellingDifficultyPicker({ selection, onDifficultyChange }: Props) {
	return (
		<GameTilePicker
			label="Độ khó"
			value={selection.spellingDifficulty ?? DEFAULT_SPELLING_DIFFICULTY}
			columns={3}
			options={PORTAL_SPELLING_DIFFICULTY_OPTIONS}
			onChange={(value) =>
				onDifficultyChange(value as DrillPracticeSelection['spellingDifficulty'])
			}
		/>
	);
}
