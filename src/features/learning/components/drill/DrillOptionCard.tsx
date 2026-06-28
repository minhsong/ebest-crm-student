'use client';

import { memo } from 'react';
import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';

export type DrillOptionVisualState = 'default' | 'selected' | 'correct' | 'wrong' | 'disabled';

type Props = {
	id: string;
	word: string;
	state: DrillOptionVisualState;
	onSelect: (id: string) => void;
};

function DrillOptionCardInner({ id, word, state, onSelect }: Props) {
	const classNames = ['drill-option-card'];
	if (state === 'selected') classNames.push('is-selected');
	if (state === 'correct') classNames.push('is-correct');
	if (state === 'wrong') classNames.push('is-wrong');

	return (
		<button
			type="button"
			className={classNames.join(' ')}
			disabled={state === 'disabled'}
			onClick={() => onSelect(id)}
		>
			<span className="drill-option-card__content">
				<span className="drill-option-card__word">{word}</span>
			</span>
		</button>
	);
}

export const DrillOptionCard = memo(DrillOptionCardInner);

export function resolveOptionState(input: {
	optionId: string;
	selectedOptionId: string | null;
	feedback: GameAnswerFeedback;
	optionsLocked: boolean;
}): DrillOptionVisualState {
	if (input.feedback && input.selectedOptionId === input.optionId) {
		return input.feedback === 'correct' ? 'correct' : 'wrong';
	}
	if (input.optionsLocked) {
		if (input.selectedOptionId === input.optionId) {
			return 'selected';
		}
		return 'disabled';
	}
	return 'default';
}
