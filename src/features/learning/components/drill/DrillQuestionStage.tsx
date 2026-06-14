'use client';

import { memo } from 'react';
import type { DrillQuestionClient } from '@/types/learning';
import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';
import type { VocabularyDrillDetailWidgetId } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { DrillPromptCard } from './DrillPromptCard';
import { DrillOptionGrid } from './DrillOptionGrid';
import { DrillFeedbackBurst } from './DrillFeedbackBurst';
import { DrillQuestionTimer } from './DrillQuestionTimer';

type Props = {
	detailWidgetId: VocabularyDrillDetailWidgetId;
	question: DrillQuestionClient;
	selectedOptionId: string | null;
	feedback: GameAnswerFeedback;
	optionsLocked: boolean;
	secondsLeft: number;
	totalSeconds: number;
	onSelect: (optionId: string) => void;
};

function DrillQuestionStageInner({
	detailWidgetId,
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
			<DrillPromptCard detailWidgetId={detailWidgetId} question={question} />
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
