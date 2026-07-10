'use client';

import { memo, useCallback } from 'react';
import type { DrillQuestionClient } from '@/types/learning';
import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';
import { DrillOptionCard, resolveOptionState } from './DrillOptionCard';

type Props = {
	options: DrillQuestionClient['options'];
	selectedOptionId: string | null;
	feedback: GameAnswerFeedback;
	optionsLocked: boolean;
	onSelect: (optionId: string) => void;
};

function DrillOptionGridInner({
	options,
	selectedOptionId,
	feedback,
	optionsLocked,
	onSelect,
}: Props) {
	const handleSelect = useCallback(
		(id: string) => {
			if (optionsLocked) return;
			onSelect(id);
		},
		[onSelect, optionsLocked],
	);

	return (
		<div>
			<p className="drill-options-section__label">
				{options.some((opt) => opt.imageUrl) ? 'Chọn hình đúng' : 'Chọn đáp án đúng'}
			</p>
			<div className="drill-option-grid" role="group" aria-label="Lựa chọn từ">
				{options.map((opt) => (
					<DrillOptionCard
						key={opt.id}
						id={opt.id}
						word={opt.label}
						imageUrl={opt.imageUrl}
						state={resolveOptionState({
							optionId: opt.id,
							selectedOptionId,
							feedback,
							optionsLocked,
						})}
						onSelect={handleSelect}
					/>
				))}
			</div>
		</div>
	);
}

export const DrillOptionGrid = memo(DrillOptionGridInner);
