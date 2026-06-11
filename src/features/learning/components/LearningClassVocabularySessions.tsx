'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Alert, Button, Empty, List, Skeleton, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useClassVocabularySessionsList } from '@/features/learning/hooks/useClassVocabularySessionsList';
import {
	flashcardSessionHref,
	vocabularySessionDetailHref,
} from '@/features/learning/utils/vocabulary-session-routes';

const { Text } = Typography;

function formatSessionDate(ymd: string): string {
	const d = new Date(`${ymd}T12:00:00`);
	if (Number.isNaN(d.getTime())) return ymd;
	return d.toLocaleDateString('vi-VN', {
		weekday: 'short',
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});
}

type Props = {
	classId: number;
	compact?: boolean;
	/** actions: nút Xem từ + Flashcard trên dòng; navigate: mở trang chi tiết buổi */
	mode?: 'actions' | 'navigate';
};

export function LearningClassVocabularySessions({
	classId,
	compact,
	mode = 'actions',
}: Props) {
	const router = useRouter();
	const { loading, error, sessions, canRecordEvents, readOnlyReason } =
		useClassVocabularySessionsList(classId);

	if (loading) {
		return <Skeleton active paragraph={{ rows: compact ? 2 : 4 }} />;
	}

	if (error) {
		return <Alert type="warning" showIcon message={error} />;
	}

	if (!canRecordEvents && readOnlyReason) {
		return (
			<>
				<Alert type="info" showIcon message={readOnlyReason} className="mb-3" />
				{renderList()}
			</>
		);
	}

	return renderList();

	function renderList() {
		if (!sessions.length) {
			return (
				<Empty
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					description="Chưa có buổi nào có từ vựng để xem."
				/>
			);
		}

		return (
			<List
				size={compact ? 'small' : 'default'}
				dataSource={sessions}
				rowKey="classSessionId"
				renderItem={(row) => {
					const href = vocabularySessionDetailHref(classId, row.classSessionId);

					if (mode === 'navigate') {
						return (
							<List.Item
								className="cursor-pointer hover:bg-[#fafafa] rounded px-2"
								onClick={() => router.push(href)}
								actions={[
									<Button
										key="open"
										type="link"
										size="small"
										icon={<RightOutlined />}
										onClick={(e) => {
											e.stopPropagation();
											router.push(href);
										}}
									>
										Chi tiết
									</Button>,
								]}
							>
								<List.Item.Meta
									title={row.title}
									description={
										<Text className="text-[#434343]">
											{formatSessionDate(row.scheduledDate)} · {row.assetCount} từ
										</Text>
									}
								/>
							</List.Item>
						);
					}

					return (
						<List.Item
							actions={[
								<Link key="words" href={href}>
									<Button size="small">Xem từ</Button>
								</Link>,
								canRecordEvents ? (
									<Link
										key="flashcard"
										href={flashcardSessionHref(classId, row.classSessionId)}
									>
										<Button size="small" type="primary">
											Flashcard
										</Button>
									</Link>
								) : null,
							].filter(Boolean)}
						>
							<List.Item.Meta
								title={row.title}
								description={
									<Text className="text-[#434343]">
										{formatSessionDate(row.scheduledDate)} · {row.assetCount} từ
									</Text>
								}
							/>
						</List.Item>
					);
				}}
			/>
		);
	}
}
