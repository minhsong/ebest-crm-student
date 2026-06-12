'use client';

import { useRouter } from 'next/navigation';
import { Button, Card, List, Typography } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import type { LearningRecommendationItem } from '@/types/learning';

const { Text } = Typography;

function buildRecommendationHref(item: LearningRecommendationItem): string {
	const action = item.action;
	switch (action.type) {
		case 'assignment_due':
			return '/assignments';
		case 'flashcard_session':
			return `/learning/flashcard?classId=${action.classId}&classSessionId=${action.classSessionId}`;
		case 'review_assets':
			return action.classId
				? `${action.route}?classId=${action.classId}`
				: action.route;
		case 'vocabulary_drill_practice':
			return action.route;
		case 'resume_attempt':
			return action.route;
		default:
			return '/learning';
	}
}

interface Props {
	items: LearningRecommendationItem[];
}

export function LearningRecommendationCards({ items }: Props) {
	const router = useRouter();

	if (!items.length) {
		return null;
	}

	return (
		<Card
			title={
				<span>
					<BulbOutlined className="mr-2" />
					Gợi ý cho bạn
				</span>
			}
		>
			<List
				dataSource={items}
				renderItem={(item) => (
					<List.Item
						actions={[
							<Button
								key="go"
								type="primary"
								size="middle"
								onClick={() => router.push(buildRecommendationHref(item))}
							>
								Làm ngay
							</Button>,
						]}
					>
						<List.Item.Meta
							title={item.title}
							description={<Text type="secondary">{item.reason}</Text>}
						/>
					</List.Item>
				)}
			/>
		</Card>
	);
}
