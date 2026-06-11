'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { SessionVocabularyDetailView } from '@/features/learning/components/SessionVocabularyDetailView';

/** Route legacy — redirect logic qua component dùng chung. */
export function SessionVocabularyListView() {
	const params = useParams();
	const searchParams = useSearchParams();
	const rawSessionId = params.classSessionId;
	const classSessionId = Number(Array.isArray(rawSessionId) ? rawSessionId[0] : rawSessionId);
	const classId = searchParams.get('classId');

	const backHref = classId
		? `/learning/vocabulary?classId=${classId}`
		: '/learning/vocabulary';

	return (
		<SessionVocabularyDetailView
			classSessionId={classSessionId}
			backHref={backHref}
			backLabel="Luyện từ vựng"
		/>
	);
}
