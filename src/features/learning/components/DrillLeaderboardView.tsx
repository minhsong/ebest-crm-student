'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
	Alert,
	Button,
	Card,
	Col,
	Flex,
	Row,
	Skeleton,
	Table,
	Tabs,
	Tag,
	Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CrownOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { fetchDrillLeaderboard } from '@/lib/learning-api';
import type { DrillLeaderboardPayload, DrillLeaderboardRow } from '@/types/learning';

const { Text } = Typography;

type ScopeTab = 'class' | 'course';
type PeriodTab = 'week' | 'month' | 'all';

const PERIOD_TABS = [
	{ key: 'week' as const, label: 'Tuần này' },
	{ key: 'month' as const, label: 'Tháng này' },
	{ key: 'all' as const, label: 'Tất cả' },
];

function useLeaderboardColumns(): ColumnsType<DrillLeaderboardRow> {
	return useMemo(
		() => [
			{
				title: '#',
				dataIndex: 'rank',
				width: 56,
				render: (rank: number) =>
					rank <= 3 ? (
						<Tag color={rank === 1 ? 'gold' : rank === 2 ? 'default' : 'orange'}>
							{rank}
						</Tag>
					) : (
						rank
					),
			},
			{
				title: 'Học viên',
				dataIndex: 'displayName',
			},
			{
				title: 'Điểm',
				dataIndex: 'score',
				width: 88,
				render: (score: number) => <Text strong>{score}</Text>,
			},
			{
				title: 'Lượt',
				dataIndex: 'playCount',
				width: 72,
			},
		],
		[],
	);
}

function LeaderboardPanel({
	classId,
	scope,
	title,
}: {
	classId: number;
	scope: ScopeTab;
	title: string;
}) {
	const columns = useLeaderboardColumns();
	const [period, setPeriod] = useState<PeriodTab>('week');
	const [data, setData] = useState<DrillLeaderboardPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(
		async (refresh = false) => {
			setLoading(true);
			setError(null);
			try {
				const payload = await fetchDrillLeaderboard(classId, scope, period, { refresh });
				setData(payload);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Không tải được bảng xếp hạng.');
			} finally {
				setLoading(false);
			}
		},
		[classId, scope, period],
	);

	useEffect(() => {
		void load(true);
	}, [load]);

	useEffect(() => {
		const onVisible = () => {
			if (document.visibilityState === 'visible') {
				void load(true);
			}
		};
		document.addEventListener('visibilitychange', onVisible);
		return () => document.removeEventListener('visibilitychange', onVisible);
	}, [load]);

	return (
		<Card
			title={
				<span>
					<TrophyOutlined className="mr-2" />
					{title}
				</span>
			}
			extra={
				<Button size="small" icon={<ReloadOutlined />} onClick={() => void load(true)}>
					Làm mới
				</Button>
			}
		>
			<Tabs
				activeKey={period}
				onChange={(key) => setPeriod(key as PeriodTab)}
				items={PERIOD_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
				className="mb-3"
			/>

			{data?.self ? (
				<Alert
					className="mb-3"
					type="info"
					showIcon
					icon={<CrownOutlined />}
					message={
						data.self.rank
							? `Bạn: #${data.self.rank} · ${data.self.score} điểm · ${data.self.playCount} lượt`
							: data.self.score > 0 || data.self.playCount > 0
								? `Bạn: ${data.self.score} điểm · ${data.self.playCount} lượt`
								: `Bạn chưa có điểm (${data.periodLabel}).`
					}
				/>
			) : null}

			{error ? <Alert className="mb-3" type="error" showIcon message={error} /> : null}

			{data?.hidden ? (
				<Alert className="mb-3" type="warning" showIcon message={data.hiddenReason} />
			) : null}

			{loading ? (
				<Skeleton active paragraph={{ rows: 6 }} />
			) : (
				<Table
					rowKey="customerId"
					size="small"
					pagination={false}
					columns={columns}
					dataSource={data?.rows ?? []}
					locale={{ emptyText: `Chưa có điểm drill — ${data?.periodLabel ?? ''}.` }}
				/>
			)}
		</Card>
	);
}

export function DrillLeaderboardView() {
	const searchParams = useSearchParams();
	const classIdParam = searchParams.get('classId');
	const classId = classIdParam ? Number(classIdParam) : null;

	if (!classId || Number.isNaN(classId)) {
		return (
			<div>
				<PageHeader title="Bảng xếp hạng" />
				<Alert type="info" showIcon message="Chọn lớp trên trang Học tập để xem bảng xếp hạng." />
				<Link href="/learning" className="mt-4 inline-block">
					<Button>Về Học tập</Button>
				</Link>
			</div>
		);
	}

	return (
		<div>
			<PageHeader title="Bảng xếp hạng luyện từ" />

			<Row gutter={[16, 16]}>
				<Col xs={24} lg={12}>
					<LeaderboardPanel classId={classId} scope="class" title="Lớp hiện tại" />
				</Col>
				<Col xs={24} lg={12}>
					<LeaderboardPanel classId={classId} scope="course" title="Toàn khóa" />
				</Col>
			</Row>

			<Flex gap="small" wrap="wrap" className="mt-4">
				<Link href={`/learning/practice?classId=${classId}`}>
					<Button type="primary">Luyện thêm</Button>
				</Link>
				<Link href="/learning">
					<Button>Về Học tập</Button>
				</Link>
			</Flex>
		</div>
	);
}
