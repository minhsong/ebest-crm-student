import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';
import {
	playDrillCorrectSound,
	playDrillWrongSound,
} from '@/features/learning/utils/game-sfx';

export const DRILL_FEEDBACK_CORRECT_MS = 480;
export const DRILL_FEEDBACK_WRONG_MS = 650;

export function playDrillAnswerSound(correct: boolean): void {
	if (correct) {
		playDrillCorrectSound();
	} else {
		playDrillWrongSound();
	}
}

export function scheduleDrillAnswerFeedback(input: {
	correct: boolean;
	setFeedback: (value: GameAnswerFeedback) => void;
	scheduleFeedback: (delayMs: number, fn: () => void) => void;
	onDone: () => void;
}): void {
	const { correct, setFeedback, scheduleFeedback, onDone } = input;
	playDrillAnswerSound(correct);
	setFeedback(correct ? 'correct' : 'wrong');
	scheduleFeedback(
		correct ? DRILL_FEEDBACK_CORRECT_MS : DRILL_FEEDBACK_WRONG_MS,
		onDone,
	);
}
