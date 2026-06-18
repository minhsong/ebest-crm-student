'use client';

import { Statistic } from 'antd';
import { LearningViewPartCard } from '@/features/learning/components/parts/LearningViewPartCard';
import type { LearningHubWeekStats } from '@/types/learning';

export type LearningWeekStatItem = {
	label: string;
	value: number;
};

type Props = {
	id?: string;
	title?: string;
	loading?: boolean;
	stats?: LearningHubWeekStats | null;
	items: Array<{
		label: string;
		resolve: (stats: LearningHubWeekStats | null | undefined) => number;
	}>;
	className?: string;
	gridClassName?: string;
};

export function LearningWeekStatsPart({
	id,
	title = 'Tuần này',
	loading = false,
	stats,
	items,
	className,
	gridClassName = 'learning-hub-stats-grid',
}: Props) {
	return (
		<LearningViewPartCard
			id={id}
			title={title}
			className={className}
			loading={loading}
			skeletonRows={2}
		>
			<div className={gridClassName}>
				{items.map((item) => (
					<Statistic
						key={item.label}
						title={item.label}
						value={item.resolve(stats)}
					/>
				))}
			</div>
		</LearningViewPartCard>
	);
}

export const LEARNING_HUB_WEEK_STAT_ITEMS: Props['items'] = [
	{ label: 'Lần luyện', resolve: (s) => s?.weekEventCount ?? 0 },
	{ label: 'Từ đã xem', resolve: (s) => s?.weekUniqueAssetsSeen ?? 0 },
	{ label: 'Quiz đã làm', resolve: (s) => s?.weekQuizAttempts ?? 0 },
	{ label: 'Điểm game tuần', resolve: (s) => s?.weekDrillScore ?? 0 },
];

export const VOCABULARY_WEEK_STAT_ITEMS: Props['items'] = [
	{ label: 'Lần luyện', resolve: (s) => s?.weekEventCount ?? 0 },
	{ label: 'Từ đã xem', resolve: (s) => s?.weekUniqueAssetsSeen ?? 0 },
	{ label: 'Quiz đã làm', resolve: (s) => s?.weekQuizAttempts ?? 0 },
];

export const GAMES_WEEK_STAT_ITEMS: Props['items'] = [
	{
		label: 'Lượt chơi',
		resolve: (s) => s?.weekDrillPlays ?? s?.weekEventCount ?? 0,
	},
	{ label: 'Điểm game', resolve: (s) => s?.weekDrillScore ?? 0 },
];
