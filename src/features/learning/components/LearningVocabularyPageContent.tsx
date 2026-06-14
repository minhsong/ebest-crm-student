'use client';

import { useSearchParams } from 'next/navigation';
import { VocabularyDashboardView } from '@/features/learning/components/VocabularyDashboardView';
import { VocabularySessionsBrowseView } from '@/features/learning/components/VocabularySessionsBrowseView';

export function LearningVocabularyPageContent() {
	const searchParams = useSearchParams();
	const view = searchParams.get('view');
	const classIdRaw = searchParams.get('classId');
	const classId = classIdRaw ? Number(classIdRaw) : NaN;

	if (view === 'sessions' && classIdRaw && !Number.isNaN(classId)) {
		return <VocabularySessionsBrowseView classId={classId} />;
	}

	return <VocabularyDashboardView />;
}
