'use client';

import { memo } from 'react';
import { theme } from 'antd';
import type { AssignmentDrillContextPayload, DrillQuestionClient } from '@/types/learning';
import type { DrillAnswerFeedback } from '@/features/learning/hooks/useDrillPracticeSession';
import type { DrillGameMode } from '@/features/learning/hooks/useDrillPracticePool';
import { DrillGameHud } from './DrillGameHud';
import { DrillQuestionStage } from './DrillQuestionStage';
import { drillAntdCssVars } from './drill-antd-theme';
import './drill-survival.css';

type Props = {
	mode: DrillGameMode;
	assignmentTitle?: string;
	backHref: string;
	score: number;
	streak: number;
	assignmentCtx: AssignmentDrillContextPayload | null;
	question: DrillQuestionClient;
	selectedOptionId: string | null;
	feedback: DrillAnswerFeedback;
	optionsLocked: boolean;
	secondsLeft: number;
	totalSeconds: number;
	onSelect: (optionId: string) => void;
};

function DrillAssignmentProgress({
	score,
	minimumScore,
}: {
	score: number;
	minimumScore: number;
}) {
	const pct = Math.min(100, Math.round((score / minimumScore) * 100));
	const reached = score >= minimumScore;
	const remaining = Math.max(0, minimumScore - score);

	return (
		<div className="drill-assignment-progress">
			<div className="drill-assignment-progress__row">
				<span>
					{reached ? (
						<>Đã đạt <strong>{minimumScore}</strong> điểm yêu cầu</>
					) : (
						<>Còn <strong>{remaining}</strong> điểm để hoàn thành bài</>
					)}
				</span>
				<span>
					<strong>{score}</strong>/{minimumScore}
				</span>
			</div>
			<div className="drill-assignment-progress__track">
				<div
					className="drill-assignment-progress__fill"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	);
}

function DrillGameLayoutInner({
	mode,
	assignmentTitle,
	backHref,
	score,
	streak,
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
		assignmentCtx.minimumScore > 0;

	return (
		<div className="drill-game-shell" style={themeVars}>
			<DrillGameHud
				mode={mode}
				title={assignmentTitle}
				backHref={backHref}
				score={score}
				streak={streak}
			/>
			{showAssignmentBar ? (
				<DrillAssignmentProgress
					score={score}
					minimumScore={assignmentCtx.minimumScore}
				/>
			) : null}
			<div className="drill-game-body">
				<DrillQuestionStage
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
