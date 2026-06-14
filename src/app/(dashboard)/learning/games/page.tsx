'use client';

import { Suspense } from 'react';
import { LearningGamesPageContent } from '@/features/learning/components/LearningGamesPageContent';

export default function LearningGamesPage() {
	return (
		<Suspense fallback={null}>
			<LearningGamesPageContent />
		</Suspense>
	);
}
