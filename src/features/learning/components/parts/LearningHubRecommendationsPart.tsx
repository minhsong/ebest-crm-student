'use client';

import { Skeleton } from 'antd';
import { LearningRecommendationCards } from '@/features/learning/components/LearningRecommendationCards';
import type { LearningRecommendationItem } from '@/types/learning';

type Props = {
	loading?: boolean;
	items?: LearningRecommendationItem[] | null;
	className?: string;
};

export function LearningHubRecommendationsPart({
	loading = false,
	items,
	className = 'mt-4',
}: Props) {
	if (loading) {
		return (
			<div className={className}>
				<Skeleton active paragraph={{ rows: 3 }} />
			</div>
		);
	}

	if (!items?.length) {
		return null;
	}

	return (
		<div className={className}>
			<LearningRecommendationCards items={items} />
		</div>
	);
}
