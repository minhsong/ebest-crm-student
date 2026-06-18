'use client';

import type { ReactNode } from 'react';
import { Button, Flex, Typography } from 'antd';
import { LearningViewPartCard } from '@/features/learning/components/parts/LearningViewPartCard';
import { formatAssignmentDeadline } from '@/lib/learning-assignments-due';
import type { LearningAssignmentDue } from '@/lib/learning-assignments-due';

const { Text } = Typography;

type Props = {
	title?: string;
	loading?: boolean;
	items: LearningAssignmentDue[];
	emptyDescription?: string;
	onOpenAssignments: () => void;
	openButtonLabel?: string;
	emptyButtonLabel?: string;
	filterItem?: (item: LearningAssignmentDue) => boolean;
	renderItemAction?: (item: LearningAssignmentDue) => ReactNode;
	maxItems?: number;
	className?: string;
};

export function LearningAssignmentsDuePart({
	title = 'Bài sắp đến hạn',
	loading = false,
	items,
	emptyDescription = 'Không có bài sắp đến hạn trong vài ngày tới.',
	onOpenAssignments,
	openButtonLabel = 'Mở trang Bài tập',
	emptyButtonLabel = 'Xem tất cả bài tập',
	filterItem,
	renderItemAction,
	maxItems = 4,
	className,
}: Props) {
	const visible = filterItem ? items.filter(filterItem) : items;
	const slice = visible.slice(0, maxItems);

	return (
		<LearningViewPartCard
			title={title}
			className={className}
			loading={loading}
			skeletonRows={3}
		>
			{slice.length > 0 ? (
				<>
					{slice.map((item) => (
						<div key={item.assignmentId} className="learning-hub-assignment-item">
							{renderItemAction ? (
								renderItemAction(item)
							) : (
								<>
									<Text strong>{item.title}</Text>
									<Text type="secondary" className="text-sm block">
										{item.className}
										{item.sessionTitle ? ` · ${item.sessionTitle}` : ''}
									</Text>
									<Text className="text-sm">
										Hạn:{' '}
										<Text strong>{formatAssignmentDeadline(item.deadline)}</Text>
									</Text>
								</>
							)}
						</div>
					))}
					<Button
						type="primary"
						size="large"
						block
						className="mt-3"
						onClick={onOpenAssignments}
					>
						{openButtonLabel}
					</Button>
				</>
			) : (
				<Flex vertical gap="small">
					<Text type="secondary">{emptyDescription}</Text>
					<Button size="large" block onClick={onOpenAssignments}>
						{emptyButtonLabel}
					</Button>
				</Flex>
			)}
		</LearningViewPartCard>
	);
}
