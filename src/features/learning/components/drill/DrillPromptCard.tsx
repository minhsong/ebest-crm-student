'use client';

import { memo } from 'react';
import type { DrillQuestionClient } from '@/types/learning';
import { VocabularyDrillPromptDetail } from '@/features/learning/games/vocabulary-drill/presentation/detail/VocabularyDrillPromptDetail';
import type { VocabularyDrillDetailWidgetId } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';

type Props = {
	detailWidgetId: VocabularyDrillDetailWidgetId;
	question: Pick<DrillQuestionClient, 'prompt' | 'promptAudioUrl'>;
};

function DrillPromptCardInner({ detailWidgetId, question }: Props) {
	return (
		<VocabularyDrillPromptDetail
			detailWidgetId={detailWidgetId}
			prompt={question.prompt}
			promptAudioUrl={question.promptAudioUrl}
		/>
	);
}

export const DrillPromptCard = memo(DrillPromptCardInner);
