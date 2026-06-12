'use client';

import { memo } from 'react';
import type { DrillAnswerFeedback } from '@/features/learning/hooks/useDrillPracticeSession';

export type DrillOptionVisualState = 'default' | 'selected' | 'correct' | 'wrong' | 'disabled';

const LETTERS = ['A', 'B', 'C', 'D'] as const;

type Props = {
	id: string;
	label: string;
	index: number;
	state: DrillOptionVisualState;
	onSelect: (id: string) => void;
};

function DrillOptionCardInner({ id, label, index, state, onSelect }: Props) {
	const classNames = ['drill-option-card'];
	if (state === 'selected') classNames.push('is-selected');
	if (state === 'correct') classNames.push('is-correct');
	if (state === 'wrong') classNames.push('is-wrong');
	const letter = LETTERS[index] ?? String(index + 1);

	return (
		<button
			type="button"
			className={classNames.join(' ')}
			disabled={state === 'disabled'}
			onClick={() => onSelect(id)}
		>
			<span className="drill-option-card__letter">{letter}</span>
			<span className="drill-option-card__word">{label}</span>
		</button>
	);
}

export const DrillOptionCard = memo(DrillOptionCardInner);

export function resolveOptionState(input: {
	optionId: string;
	selectedOptionId: string | null;
	feedback: DrillAnswerFeedback;
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
