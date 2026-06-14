'use client';

import { Suspense } from 'react';
import { LearningVocabularyPageContent } from '@/features/learning/components/LearningVocabularyPageContent';

export default function VocabularyPracticePage() {
	return (
		<Suspense fallback={null}>
			<LearningVocabularyPageContent />
		</Suspense>
	);
}
