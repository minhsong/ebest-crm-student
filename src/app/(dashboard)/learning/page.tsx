'use client';

import { Suspense } from 'react';
import { LearningHubView } from '@/features/learning';

export default function LearningPage() {
	return (
		<Suspense fallback={null}>
			<LearningHubView />
		</Suspense>
	);
}
