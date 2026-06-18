'use client';

import { Button, Empty, Flex, Typography } from 'antd';
import { BookOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { LearningViewPartCard } from '@/features/learning/components/parts/LearningViewPartCard';
import { formatNearestSessionDate } from '@/features/learning/utils/format-nearest-session-date';
import type { LearningHubNearestSession } from '@/types/learning';

const { Text } = Typography;

type Props = {
	loading?: boolean;
	nearest: LearningHubNearestSession | null;
	canFlashcard: boolean;
	onFlashcard: () => void;
	onWordList: () => void;
	onBrowseAllSessions: () => void;
};

export function LearningHubFeaturedSessionPart({
	loading = false,
	nearest,
	canFlashcard,
	onFlashcard,
	onWordList,
	onBrowseAllSessions,
}: Props) {
	return (
		<LearningViewPartCard
			className="learning-hub-featured"
			title={
				<span>
					<BookOutlined className="mr-2" />
					Từ vựng gần nhất
				</span>
			}
			loading={loading}
			skeletonRows={4}
		>
			{nearest ? (
				<>
					<div className="learning-hub-featured__meta">
						<Text strong className="text-base">
							{nearest.title}
						</Text>
						<Text type="secondary">
							{nearest.className} · {nearest.assetCount} từ ·{' '}
							{formatNearestSessionDate(nearest.scheduledDate, nearest.isToday)}
						</Text>
					</div>
					<div className="learning-hub-featured__actions">
						<Button
							type="primary"
							size="large"
							block
							icon={<BookOutlined />}
							disabled={!canFlashcard}
							onClick={onFlashcard}
						>
							Luyện flashcard
						</Button>
						<Button
							size="large"
							block
							icon={<UnorderedListOutlined />}
							onClick={onWordList}
						>
							Xem danh sách từ
						</Button>
					</div>
				</>
			) : (
				<Flex vertical gap="middle">
					<Empty
						image={Empty.PRESENTED_IMAGE_SIMPLE}
						description="Chưa có buổi nào có từ vựng để ôn. Hãy xem danh sách buổi học."
					/>
					<Button size="large" block onClick={onBrowseAllSessions}>
						Xem tất cả buổi
					</Button>
				</Flex>
			)}
		</LearningViewPartCard>
	);
}
