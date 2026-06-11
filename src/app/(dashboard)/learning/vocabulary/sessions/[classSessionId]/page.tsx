'use client';

import { useParams } from 'next/navigation';
import { SessionVocabularyDetailView } from '@/features/learning/components/SessionVocabularyDetailView';

export default function VocabularySessionDetailPage() {
	const params = useParams();
	const raw = params.classSessionId;
	const classSessionId = Number(Array.isArray(raw) ? raw[0] : raw);

	return (
		<SessionVocabularyDetailView
			classSessionId={classSessionId}
			backHref="/learning/vocabulary"
			backLabel="Luyện từ vựng"
		/>
	);
}
