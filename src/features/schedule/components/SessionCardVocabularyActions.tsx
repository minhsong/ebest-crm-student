'use client';

import Link from 'next/link';
import { Button, Space } from 'antd';
import { BookOutlined, ReadOutlined } from '@ant-design/icons';
import { useClassVocabularySessionMap } from '@/features/learning/hooks/useClassVocabularySessionMap';
import {
	sessionKnowledgeContentHref,
	vocabularySessionDetailHref,
} from '@/features/learning/utils/vocabulary-session-routes';

type Props = {
	classId: number;
	classSessionId: number;
};

/**
 * Actions học tập trên thẻ buổi lịch: từ vựng (nếu có asset) + nội dung bài học (KB M2).
 */
export function SessionCardVocabularyActions({ classId, classSessionId }: Props) {
	const { loading, assetCountFor } = useClassVocabularySessionMap(classId);
	const assetCount = assetCountFor(classSessionId);
	const showVocab = !loading && assetCount > 0;

	return (
		<Space size={6} wrap>
			{showVocab ? (
				<Link href={vocabularySessionDetailHref(classId, classSessionId)}>
					<Button size="small" icon={<BookOutlined />}>
						Xem từ
					</Button>
				</Link>
			) : null}
			<Link href={sessionKnowledgeContentHref(classId, classSessionId)}>
				<Button size="small" icon={<ReadOutlined />}>
					Bài học
				</Button>
			</Link>
		</Space>
	);
}
