'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
	Alert,
	Button,
	Card,
	Col,
	Flex,
	Input,
	Row,
	Select,
	Skeleton,
	Table,
	Tabs,
	Tag,
	Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CrownOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { GAME_CATALOG_ENTRIES } from '@/features/learning/games/catalog/game-catalog.registry';
import type { GameModeApiId } from '@/features/learning/games/session/game-mode.utils';
import {
	vocabularyPracticeHref,
	vocabularyLeaderboardHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { fetchDrillLeaderboard } from '@/lib/learning-api';
import { formatDrillDurationMs } from '@/features/learning/utils/format-drill-duration';
import type {
	DrillLeaderboardBoardKind,
	DrillLeaderboardPayload,
	DrillLeaderboardPerPlayRow,
	DrillLeaderboardRow,
} from '@/types/learning';

const { Text } = Typography;

type ScopeTab = 'class' | 'course';
type PeriodTab = 'week' | 'month' | 'all';

const PERIOD_TABS = [
	{ key: 'week' as const, label: 'Tuần này' },
	{ key: 'month' as const, label: 'Tháng này' },
	{ key: 'all' as const, label: 'Tất cả' },
];

const BOARD_KIND_TABS: { key: DrillLeaderboardBoardKind; label: string }[] = [
	{ key: 'per_play_score', label: 'Điểm từng lượt' },
	{ key: 'total_plays', label: 'Số lượt chơi' },
	{ key: 'total_correct', label: 'Số câu đúng' },
];

const MODE_FILTER_OPTIONS: { value: GameModeApiId; label: string }[] = [
	{ value: 'survival', label: 'Sinh tồn' },
	{ value: 'pool_coverage', label: 'Best of' },
	{ value: 'speed_run', label: 'Tốc độ' },
];

const GAME_FILTER_OPTIONS = GAME_CATALOG_ENTRIES.map((entry) => ({
	value: entry.promptType,
	label: entry.title,
}));

function isPerPlayRow(row: DrillLeaderboardRow | DrillLeaderboardPerPlayRow): row is DrillLeaderboardPerPlayRow {
	return 'playId' in row;
}

function usePerPlayColumns(): ColumnsType<DrillLeaderboardPerPlayRow> {
	return useMemo(
		() => [
			{
				title: '#',
				dataIndex: 'rank',
				width: 56,
				render: (rank: number) =>
					rank <= 3 ? (
						<Tag color={rank === 1 ? 'gold' : rank === 2 ? 'default' : 'orange'}>{rank}</Tag>
					) : (
						rank
					),
			},
			{ title: 'Học viên', dataIndex: 'displayName' },
			{ title: 'Lớp', dataIndex: 'className', width: 100 },
			{
				title: 'Điểm lượt',
				dataIndex: 'score',
				width: 88,
				render: (score: number) => <Text strong>{score}</Text>,
			},
			{
				title: 'Thời gian làm',
				dataIndex: 'durationMs',
				width: 104,
				render: (value: number | null) => formatDrillDurationMs(value),
			},
		],
		[],
	);
}

function useAggregateColumns(boardKind: DrillLeaderboardBoardKind): ColumnsType<DrillLeaderboardRow> {
	return useMemo(
		() => [
			{
				title: '#',
				dataIndex: 'rank',
				width: 56,
				render: (rank: number) =>
					rank <= 3 ? (
						<Tag color={rank === 1 ? 'gold' : rank === 2 ? 'default' : 'orange'}>{rank}</Tag>
					) : (
						rank
					),
			},
			{ title: 'Học viên', dataIndex: 'displayName' },
			{
				title: boardKind === 'total_plays' ? 'Lượt chơi' : 'Câu đúng',
				dataIndex: 'score',
				width: 100,
				render: (score: number) => <Text strong>{score}</Text>,
			},
		],
		[boardKind],
	);
}

function LeaderboardPanel({
	classId,
	scope,
	title,
	promptType,
	modeId,
}: {
	classId: number;
	scope: ScopeTab;
	title: string;
	promptType?: string;
	modeId?: string;
}) {
	const perPlayColumns = usePerPlayColumns();
	const [boardKind, setBoardKind] = useState<DrillLeaderboardBoardKind>('per_play_score');
	const aggregateColumns = useAggregateColumns(boardKind);
	const [period, setPeriod] = useState<PeriodTab>('week');
	const [page, setPage] = useState(1);
	const [nameQuery, setNameQuery] = useState('');
	const [appliedQuery, setAppliedQuery] = useState('');
	const [data, setData] = useState<DrillLeaderboardPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(
		async (targetPage = page) => {
			setLoading(true);
			setError(null);
			try {
				const payload = await fetchDrillLeaderboard(classId, scope, period, {
					boardKind,
					page: targetPage,
					pageSize: 10,
					q: appliedQuery || undefined,
					filterClassId: scope === 'course' ? classId : undefined,
					promptType,
					modeId,
					refresh: true,
				});
				setData(payload);
			} catch (err) {
				setError(err instanceof Error ? err.message : 'Không tải được bảng xếp hạng.');
			} finally {
				setLoading(false);
			}
		},
		[classId, scope, period, boardKind, page, appliedQuery, promptType, modeId],
	);

	useEffect(() => {
		setPage(1);
	}, [boardKind, period, appliedQuery, scope]);

	useEffect(() => {
		void load(page);
	}, [load, page]);

	const selfMessage = useMemo(() => {
		if (!data?.self) return null;
		const { self } = data;
		if (boardKind === 'per_play_score') {
			return self.rank
				? `Bạn: #${self.rank} · ${self.score} câu đúng (lượt tốt nhất)${self.pageHint ? ` · trang ${self.pageHint}` : ''}`
				: 'Bạn chưa có lượt chơi trong kỳ này.';
		}
		return self.rank
			? `Bạn: #${self.rank} · ${self.score} ${boardKind === 'total_plays' ? 'lượt' : 'câu đúng'}`
			: `Bạn chưa có dữ liệu (${data.periodLabel}).`;
	}, [data, boardKind]);

	return (
		<Card
			title={
				<span>
					<TrophyOutlined className="mr-2" />
					{title}
				</span>
			}
			extra={
				<Button size="small" icon={<ReloadOutlined />} onClick={() => void load(page)}>
					Làm mới
				</Button>
			}
		>
			<Tabs
				activeKey={boardKind}
				onChange={(key) => setBoardKind(key as DrillLeaderboardBoardKind)}
				items={BOARD_KIND_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
				className="mb-3"
			/>

			<Tabs
				activeKey={period}
				onChange={(key) => setPeriod(key as PeriodTab)}
				items={PERIOD_TABS.map((tab) => ({ key: tab.key, label: tab.label }))}
				className="mb-3"
			/>

			<Flex gap="small" wrap="wrap" className="mb-3">
				<Input.Search
					allowClear
					placeholder="Lọc theo tên học viên"
					value={nameQuery}
					onChange={(e) => setNameQuery(e.target.value)}
					onSearch={(value) => setAppliedQuery(value.trim())}
					style={{ maxWidth: 280 }}
				/>
			</Flex>

			{selfMessage ? (
				<Alert
					className="mb-3"
					type="info"
					showIcon
					icon={<CrownOutlined />}
					message={selfMessage}
					action={
						data?.self?.pageHint && data.self.pageHint !== page ? (
							<Button size="small" onClick={() => setPage(data.self!.pageHint!)}>
								Xem trang của tôi
							</Button>
						) : undefined
					}
				/>
			) : null}

			{error ? <Alert className="mb-3" type="error" showIcon message={error} /> : null}

			{data?.hidden ? (
				<Alert className="mb-3" type="warning" showIcon message={data.hiddenReason} />
			) : null}

			{loading ? (
				<Skeleton active paragraph={{ rows: 6 }} />
			) : boardKind === 'per_play_score' ? (
				<Table<DrillLeaderboardPerPlayRow>
					rowKey="playId"
					size="small"
					columns={perPlayColumns}
					dataSource={(data?.rows ?? []).filter(isPerPlayRow)}
					pagination={{
						current: data?.page ?? page,
						pageSize: data?.pageSize ?? 10,
						total: data?.total ?? 0,
						showSizeChanger: false,
						onChange: (nextPage) => setPage(nextPage),
					}}
					locale={{ emptyText: `Chưa có lượt chơi — ${data?.periodLabel ?? ''}.` }}
				/>
			) : (
				<Table<DrillLeaderboardRow>
					rowKey="customerId"
					size="small"
					columns={aggregateColumns}
					dataSource={data?.rows ?? []}
					pagination={{
						current: data?.page ?? page,
						pageSize: data?.pageSize ?? 10,
						total: data?.total ?? 0,
						showSizeChanger: false,
						onChange: (nextPage) => setPage(nextPage),
					}}
					locale={{ emptyText: `Chưa có dữ liệu — ${data?.periodLabel ?? ''}.` }}
				/>
			)}
		</Card>
	);
}

export function DrillLeaderboardView() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const classIdParam = searchParams.get('classId');
	const classId = classIdParam ? Number(classIdParam) : null;
	const promptType = searchParams.get('promptType')?.trim() || undefined;
	const modeId = searchParams.get('modeId')?.trim() || undefined;

	const filterSummary = useMemo(() => {
		const parts: string[] = [];
		const game = GAME_CATALOG_ENTRIES.find((e) => e.promptType === promptType);
		if (game) parts.push(game.title);
		const mode = MODE_FILTER_OPTIONS.find((m) => m.value === modeId);
		if (mode) parts.push(mode.label);
		return parts.length ? parts.join(' · ') : null;
	}, [modeId, promptType]);

	const updateFilters = useCallback(
		(next: { promptType?: string; modeId?: string }) => {
			if (!classId) return;
			const href = vocabularyLeaderboardHref(classId, {
				promptType: next.promptType,
				modeId: next.modeId,
			});
			router.replace(href);
		},
		[classId, router],
	);

	if (!classId || Number.isNaN(classId)) {
		return null;
	}

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Bảng xếp hạng luyện từ"
				description={
					filterSummary
						? `Lọc: ${filterSummary} — so sánh theo lớp và toàn khóa.`
						: 'So sánh theo lớp và toàn khóa — quay lại dashboard để đổi lớp.'
				}
				extra={
					<Link href="/learning/games/leaderboard">
						<Button>Về BXH</Button>
					</Link>
				}
			/>

			<Flex gap="small" wrap="wrap" className="mb-4">
				<Select
					allowClear
					placeholder="Tất cả game"
					style={{ minWidth: 200 }}
					options={GAME_FILTER_OPTIONS}
					value={promptType}
					onChange={(value) =>
						updateFilters({ promptType: value ?? undefined, modeId })
					}
				/>
				<Select
					allowClear
					placeholder="Tất cả chế độ"
					style={{ minWidth: 160 }}
					options={MODE_FILTER_OPTIONS}
					value={modeId as GameModeApiId | undefined}
					onChange={(value) =>
						updateFilters({ promptType, modeId: value ?? undefined })
					}
				/>
				{filterSummary ? <Tag color="blue">Đang lọc: {filterSummary}</Tag> : null}
			</Flex>

			<Row gutter={[16, 16]}>
				<Col xs={24} lg={12}>
					<LeaderboardPanel
						classId={classId}
						scope="class"
						title="Lớp hiện tại"
						promptType={promptType}
						modeId={modeId}
					/>
				</Col>
				<Col xs={24} lg={12}>
					<LeaderboardPanel
						classId={classId}
						scope="course"
						title="Toàn khóa"
						promptType={promptType}
						modeId={modeId}
					/>
				</Col>
			</Row>

			<Flex gap="small" wrap="wrap" className="mt-4">
				<Link href={vocabularyPracticeHref(classId)}>
					<Button type="primary">Luyện thêm</Button>
				</Link>
				<Link href="/learning/games">
					<Button>Trang Game</Button>
				</Link>
			</Flex>
		</div>
	);
}
