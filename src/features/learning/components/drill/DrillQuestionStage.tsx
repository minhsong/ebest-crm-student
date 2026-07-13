'use client';

import { memo } from 'react';
import type { DrillQuestionClient } from '@/types/learning';
import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';
import type { VocabularyDrillDetailWidgetId } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { DrillPromptCard } from './DrillPromptCard';
import { DrillOptionGrid } from './DrillOptionGrid';
import { DrillFeedbackBurst } from './DrillFeedbackBurst';
import { DrillQuestionTimer } from './DrillQuestionTimer';
import { SpellingQuestionStage } from './SpellingQuestionStage';

type Props = {
	detailWidgetId: VocabularyDrillDetailWidgetId;
	question: DrillQuestionClient;
	selectedOptionId: string | null;
	feedback: GameAnswerFeedback;
	optionsLocked: boolean;
	secondsLeft: number;
	totalSeconds: number;
	onSelect: (optionId: string) => void;
	onSpellingSubmit?: (tileIds: string[]) => void;
	onRegisterSpellingGetAnswerTiles?: (getter: (() => string[]) | null) => void;
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
	onSpellingSubmit,
	onRegisterSpellingGetAnswerTiles,
}: Props) {
	if (detailWidgetId === 'spelling_tiles') {
		return (
			<SpellingQuestionStage
				question={question}
				feedback={feedback}
				optionsLocked={optionsLocked}
				secondsLeft={secondsLeft}
				totalSeconds={totalSeconds}
				onSubmit={(tileIds) => onSpellingSubmit?.(tileIds)}
				onRegisterGetAnswerTiles={onRegisterSpellingGetAnswerTiles}
			/>
		);
	}

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
