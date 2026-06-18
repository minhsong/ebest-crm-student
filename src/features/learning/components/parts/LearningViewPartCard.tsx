'use client';

import type { ReactNode } from 'react';
import { Card, Skeleton } from 'antd';

type Props = {
	id?: string;
	title?: ReactNode;
	className?: string;
	loading?: boolean;
	skeletonRows?: number;
	children: ReactNode;
};

/** Card section với skeleton nội bộ — không chặn cả page. */
export function LearningViewPartCard({
	id,
	title,
	className,
	loading = false,
	skeletonRows = 3,
	children,
}: Props) {
	return (
		<Card id={id} title={title} className={className}>
			{loading ? <Skeleton active paragraph={{ rows: skeletonRows }} title={false} /> : children}
		</Card>
	);
}
