'use client';

import { memo } from 'react';
import type { DrillQuestionClient } from '@/types/learning';
import type { DrillAnswerFeedback } from '@/features/learning/hooks/useDrillPracticeSession';
import { DrillPromptCard } from './DrillPromptCard';
import { DrillOptionGrid } from './DrillOptionGrid';
import { DrillFeedbackBurst } from './DrillFeedbackBurst';
import { DrillQuestionTimer } from './DrillQuestionTimer';

type Props = {
	question: DrillQuestionClient;
	selectedOptionId: string | null;
	feedback: DrillAnswerFeedback;
	optionsLocked: boolean;
	secondsLeft: number;
	totalSeconds: number;
	onSelect: (optionId: string) => void;
};

function DrillQuestionStageInner({
	question,
	selectedOptionId,
	feedback,
	optionsLocked,
	secondsLeft,
	totalSeconds,
	onSelect,
}: Props) {
	return (
		<div className="drill-survival-stage">
			<DrillQuestionTimer secondsLeft={secondsLeft} totalSeconds={totalSeconds} />
			<DrillPromptCard question={question} />
			<div className="drill-options-panel">
				<DrillOptionGrid
					options={question.options}
					selectedOptionId={selectedOptionId}
					feedback={feedback}
					optionsLocked={optionsLocked}
					onSelect={onSelect}
				/>
			</div>
			<DrillFeedbackBurst feedback={feedback} />
		</div>
	);
}

export const DrillQuestionStage = memo(DrillQuestionStageInner);
