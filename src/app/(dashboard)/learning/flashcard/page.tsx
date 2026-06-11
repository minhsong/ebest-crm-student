'use client';

import { Suspense } from 'react';
import { FlashcardSessionView } from '@/features/learning';

export default function LearningFlashcardPage() {
	return (
		<Suspense fallback={null}>
			<FlashcardSessionView />
		</Suspense>
	);
}
