'use client';

import { Suspense } from 'react';
import { DrillLeaderboardView } from '@/features/learning/components/DrillLeaderboardView';

export default function LearningLeaderboardPage() {
	return (
		<Suspense fallback={null}>
			<DrillLeaderboardView />
		</Suspense>
	);
}
