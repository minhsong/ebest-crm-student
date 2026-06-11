'use client';

import Link from 'next/link';
import { Button } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useClassVocabularySessionMap } from '@/features/learning/hooks/useClassVocabularySessionMap';

type Props = {
	classId: number;
	classSessionId: number;
};

export function SessionCardVocabularyActions({ classId, classSessionId }: Props) {
	const { loading, assetCountFor } = useClassVocabularySessionMap(classId);
	const assetCount = assetCountFor(classSessionId);

	if (loading || assetCount <= 0) {
		return null;
	}

	return (
		<Link
			href={`/learning/vocabulary/sessions/${classSessionId}?classId=${classId}`}
		>
			<Button size="small" icon={<BookOutlined />}>
				Xem từ
			</Button>
		</Link>
	);
}
