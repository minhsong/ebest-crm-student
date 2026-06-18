'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button, Card, Skeleton, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningClassVocabularySessions } from '@/features/learning/components/LearningClassVocabularySessions';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';

const { Text } = Typography;

type Props = {
	classId: number;
};

/** `/learning/vocabulary?classId=&view=sessions` — tên lớp lazy, danh sách buổi load độc lập. */
export function VocabularySessionsBrowseView({ classId }: Props) {
	const { data, hubLoading } = useLearningHub();

	const className = useMemo(
		() => data?.classes?.find((c) => c.classId === classId)?.className ?? null,
		[data?.classes, classId],
	);

	const description = hubLoading ? (
		<Skeleton.Input active size="small" style={{ width: 280 }} />
	) : (
		`${className ?? 'Lớp học'} — chạm buổi để xem từ hoặc luyện flashcard.`
	);

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Danh sách buổi"
				description={description}
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
