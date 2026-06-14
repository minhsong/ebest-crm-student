'use client';

import { memo } from 'react';
import { theme } from 'antd';
import type { AssignmentDrillContextPayload, DrillQuestionClient } from '@/types/learning';
import type { GameAnswerFeedback } from '@/features/learning/games/core/types/game-session.types';
import type { VocabularyDrillPresentationProfile } from '@/features/learning/games/vocabulary-drill/vocabulary-drill-presentation.mapper';
import { VocabularyDrillGameHud } from '@/features/learning/games/vocabulary-drill/presentation/hud/VocabularyDrillGameHud';
import { VocabularyDrillAssignmentProgress } from '@/features/learning/games/vocabulary-drill/presentation/layout/VocabularyDrillAssignmentProgress';
import { DrillQuestionStage } from './DrillQuestionStage';
import { drillAntdCssVars } from './drill-antd-theme';
import './drill-survival.css';

type Props = {
	presentation: VocabularyDrillPresentationProfile;
	assignmentTitle?: string;
	backHref: string;
	score: number;
	streak: number;
	poolProgress?: {
		answered: number;
		total: number;
		correct: number;
		wrong: number;
	} | null;
	assignmentCtx: AssignmentDrillContextPayload | null;
	question: DrillQuestionClient;
	selectedOptionId: string | null;
	feedback: GameAnswerFeedback;
	optionsLocked: boolean;
	secondsLeft: number;
	totalSeconds: number;
	onSelect: (optionId: string) => void;
};

function DrillGameLayoutInner({
	presentation,
	assignmentTitle,
	backHref,
	score,
	streak,
	poolProgress,
	assignmentCtx,
	question,
	selectedOptionId,
	feedback,
	optionsLocked,
	secondsLeft,
	totalSeconds,
	onSelect,
}: Props) {
	const { token } = theme.useToken();
	const themeVars = drillAntdCssVars(token);

	const showAssignmentBar =
		assignmentCtx != null &&
		!assignmentCtx.assignmentComplete &&
		assignmentCtx.minimumScore > 0 &&
		(presentation.usesPoolProgressBar ? Boolean(poolProgress) : true);

	return (
		<div className="drill-game-shell" style={themeVars}>
			<VocabularyDrillGameHud
				presentation={presentation}
				title={assignmentTitle}
				backHref={backHref}
				score={score}
				streak={streak}
			/>
			{showAssignmentBar ? (
				<VocabularyDrillAssignmentProgress
					presentation={presentation}
					score={score}
					minimumScore={assignmentCtx!.minimumScore}
					poolProgress={poolProgress}
				/>
			) : null}
			<div className="drill-game-body">
				<DrillQuestionStage
					detailWidgetId={presentation.detailWidgetId}
					question={question}
					selectedOptionId={selectedOptionId}
					feedback={feedback}
					optionsLocked={optionsLocked}
					secondsLeft={secondsLeft}
					totalSeconds={totalSeconds}
					onSelect={onSelect}
				/>
			</div>
		</div>
	);
}

export const DrillGameLayout = memo(DrillGameLayoutInner);
