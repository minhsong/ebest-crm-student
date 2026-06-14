'use client';

import type { ReactNode } from 'react';
import './learning-dashboard-shared.css';

export type LearningDashboardActionVariant =
	| 'vocabulary'
	| 'flashcard'
	| 'sessions'
	| 'play'
	| 'leaderboard'
	| 'assignments'
	| 'hub'
	| 'browse'
	| 'quiz';

type Props = {
	variant: LearningDashboardActionVariant;
	icon: ReactNode;
	title: string;
	description: string;
	hint?: string;
	disabled?: boolean;
	onClick: () => void;
};

export function LearningDashboardActionCard({
	variant,
	icon,
	title,
	description,
	hint,
	disabled,
	onClick,
}: Props) {
	return (
		<button
			type="button"
			className={`learning-dashboard-action learning-dashboard-action--${variant}`}
			disabled={disabled}
			onClick={onClick}
		>
			<span className="learning-dashboard-action__blob learning-dashboard-action__blob--a" aria-hidden />
			<span className="learning-dashboard-action__icon-wrap">{icon}</span>
			<span className="learning-dashboard-action__content">
				<span className="learning-dashboard-action__title">{title}</span>
				<span className="learning-dashboard-action__desc">{description}</span>
				{hint ? <span className="learning-dashboard-action__hint">{hint}</span> : null}
			</span>
		</button>
	);
}
