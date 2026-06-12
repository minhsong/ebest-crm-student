'use client';

import { memo } from 'react';

type Props = {
	secondsLeft: number;
	totalSeconds: number;
};

function DrillQuestionTimerInner({ secondsLeft, totalSeconds }: Props) {
	const pct = totalSeconds > 0 ? (secondsLeft / totalSeconds) * 100 : 0;
	const urgent = secondsLeft <= 3;

	return (
		<div
			className={`drill-timer${urgent ? ' drill-timer--urgent' : ''}`}
			role="timer"
			aria-live="polite"
			aria-label={`Còn ${secondsLeft} giây`}
		>
			<div className="drill-timer__track">
				<div className="drill-timer__fill" style={{ width: `${pct}%` }} />
			</div>
			<span className="drill-timer__label">{secondsLeft}s</span>
		</div>
	);
}

export const DrillQuestionTimer = memo(DrillQuestionTimerInner);
