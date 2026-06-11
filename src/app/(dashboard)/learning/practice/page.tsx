'use client';

import { Suspense } from 'react';
import { DrillPracticeView } from '@/features/learning/components/DrillPracticeView';

export default function LearningPracticePage() {
	return (
		<Suspense fallback={null}>
			<DrillPracticeView />
		</Suspense>
	);
}
