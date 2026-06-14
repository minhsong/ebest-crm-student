'use client';

import { Suspense } from 'react';
import { LearningLeaderboardPageContent } from '@/features/learning/components/LearningLeaderboardPageContent';

export default function LearningGamesLeaderboardPage() {
	return (
		<Suspense fallback={null}>
			<LearningLeaderboardPageContent />
		</Suspense>
	);
}
