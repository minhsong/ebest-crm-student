'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { Skeleton } from 'antd';
import { SessionKnowledgeContentView } from '@/features/learning/components/SessionKnowledgeContentView';

function SessionKnowledgeContentPageInner() {
	const params = useParams();
	const raw = params.classSessionId;
	const classSessionId = Number(Array.isArray(raw) ? raw[0] : raw);

	return <SessionKnowledgeContentView classSessionId={classSessionId} />;
}

export default function SessionKnowledgeContentPage() {
	return (
		<Suspense fallback={<Skeleton active paragraph={{ rows: 8 }} />}>
			<SessionKnowledgeContentPageInner />
		</Suspense>
	);
}
