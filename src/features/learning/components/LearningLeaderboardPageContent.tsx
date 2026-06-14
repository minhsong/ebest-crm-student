'use client';

import { useSearchParams } from 'next/navigation';
import { DrillLeaderboardView } from '@/features/learning/components/DrillLeaderboardView';
import { LeaderboardDashboardView } from '@/features/learning/components/LeaderboardDashboardView';

function hasLeaderboardContext(searchParams: URLSearchParams): boolean {
	const classId = searchParams.get('classId');
	return Boolean(classId && !Number.isNaN(Number(classId)));
}

export function LearningLeaderboardPageContent() {
	const searchParams = useSearchParams();

	if (hasLeaderboardContext(searchParams)) {
		return <DrillLeaderboardView />;
	}

	return <LeaderboardDashboardView />;
}
