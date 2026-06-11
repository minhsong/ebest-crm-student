import Link from 'next/link';
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
	if (!items.length) {
		return null;
	}

	return (
		<Card
			className="mb-4"
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
							<Link key="go" href={buildRecommendationHref(item)}>
								<Button type="link" className="!px-0">
									Làm ngay
								</Button>
							</Link>,
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
