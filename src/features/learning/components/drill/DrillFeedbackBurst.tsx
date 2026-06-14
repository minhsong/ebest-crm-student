'use client';

import { memo } from 'react';
import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';

type Props = {
	feedback: GameAnswerFeedback;
};

function DrillFeedbackBurstInner({ feedback }: Props) {
	if (!feedback) return null;

	return (
		<div className={`drill-feedback-toast is-${feedback}`} aria-live="assertive">
			{feedback === 'correct' ? 'Chính xác · +1' : 'Chưa đúng'}
		</div>
	);
}

export const DrillFeedbackBurst = memo(DrillFeedbackBurstInner);
