'use client';

import { Card, Skeleton, Typography } from 'antd';
import { formatNearestSessionDate } from '@/features/learning/utils/format-nearest-session-date';
import type { LearningHubNearestSession } from '@/types/learning';

const { Text } = Typography;

type Props = {
	loading?: boolean;
	nearest: LearningHubNearestSession | null;
	className?: string;
};

/** Banner buổi gần nhất trên dashboard từ vựng. */
export function LearningNearestSessionBannerPart({
	loading = false,
	nearest,
	className = 'mt-4 learning-dashboard-featured',
}: Props) {
	if (loading) {
		return (
			<Card className={className} size="small">
				<Skeleton active paragraph={{ rows: 2 }} title={false} />
			</Card>
		);
	}

	if (!nearest) {
		return null;
	}

	return (
		<Card className={className} size="small">
			<Text type="secondary" className="text-xs uppercase tracking-wide">
				Buổi gần nhất
			</Text>
			<Text strong className="mt-1 block text-base">
				{nearest.title}
			</Text>
			<Text type="secondary" className="text-sm">
				{nearest.className} · {nearest.assetCount} từ ·{' '}
				{formatNearestSessionDate(nearest.scheduledDate, nearest.isToday)}
			</Text>
		</Card>
	);
}
