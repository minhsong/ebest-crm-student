'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button, Card, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningClassVocabularySessions } from '@/features/learning/components/LearningClassVocabularySessions';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';

const { Text } = Typography;

type Props = {
	classId: number;
};

/** `/learning/vocabulary?classId=&view=sessions` — duyệt buổi sau khi chọn action trên dashboard. */
export function VocabularySessionsBrowseView({ classId }: Props) {
	const { data } = useLearningHub();

	const className = useMemo(
		() => data?.classes?.find((c) => c.classId === classId)?.className ?? 'Lớp học',
		[data?.classes, classId],
	);

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Danh sách buổi"
				description={`${className} — chạm buổi để xem từ hoặc luyện flashcard.`}
				extra={
					<Link href="/learning/vocabulary">
						<Button icon={<ArrowLeftOutlined />}>Về Luyện từ vựng</Button>
					</Link>
				}
			/>

			<Card className="learning-dashboard-browse-panel" title="Buổi học có từ vựng">
				<Text type="secondary" className="mb-3 block text-sm">
					Mỗi buổi mở danh sách từ dạng card; có thể luyện flashcard từng buổi.
				</Text>
				<LearningClassVocabularySessions classId={classId} mode="navigate" />
			</Card>
		</div>
	);
}
