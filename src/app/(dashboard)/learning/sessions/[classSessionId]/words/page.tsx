'use client';

import { Suspense } from 'react';
import { SessionVocabularyListView } from '@/features/learning';

export default function SessionVocabularyPage() {
	return (
		<Suspense fallback={null}>
			<SessionVocabularyListView />
		</Suspense>
	);
}
