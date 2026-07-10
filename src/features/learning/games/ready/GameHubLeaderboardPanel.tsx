'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Skeleton, Table, Typography } from 'antd';
import { CrownOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

import { fetchDrillLeaderboard } from '@/lib/learning-api';
import { vocabularyLeaderboardHref } from '@/features/learning/utils/vocabulary-session-routes';
import type { DrillLeaderboardPerPlayRow, DrillLeaderboardPayload } from '@/types/learning';
import { formatDrillDurationMs } from '@/features/learning/utils/format-drill-duration';

const { Text } = Typography;

type Props = {
	classId: number;
	gameTitle: string;
	promptType: string;
	modeId: string;
};

function isPerPlayRow(
	row: DrillLeaderboardPayload['rows'][number],
): row is DrillLeaderboardPerPlayRow {
	return 'playId' in row;
}

const columns: ColumnsType<DrillLeaderboardPerPlayRow> = [
	{
		title: '#',
		dataIndex: 'rank',
		width: 40,
		render: (rank: number) => (rank <= 3 ? `#${rank}` : rank),
	},
	{ title: 'HV', dataIndex: 'displayName', ellipsis: true },
	{
		title: 'Điểm',
		dataIndex: 'score',
		width: 52,
		render: (score: number) => <Text strong>{score}</Text>,
	},
	{
		title: 'TG',
		dataIndex: 'durationMs',
		width: 56,
		render: (ms: number | null) => (ms != null ? formatDrillDurationMs(ms) : '—'),
	},
];

/** BXH snapshot trên hub — tuần này, lớp, per_play_score, theo game + mode. */
export function GameHubLeaderboardPanel({ classId, gameTitle, promptType, modeId }: Props) {
	const router = useRouter();
	const [data, setData] = useState<DrillLeaderboardPayload | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const payload = await fetchDrillLeaderboard(classId, 'class', 'week', {
				boardKind: 'per_play_score',
				page: 1,
				pageSize: 10,
				promptType,
				modeId,
			});
			setData(payload);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Không tải được bảng xếp hạng.');
		} finally {
			setLoading(false);
		}
	}, [classId, modeId, promptType]);

	useEffect(() => {
		void load();
	}, [load]);

	const rows = useMemo(
		() => (data?.rows ?? []).filter(isPerPlayRow).slice(0, 5),
		[data?.rows],
	);

	const selfMessage = useMemo(() => {
		if (!data?.self?.rank) {
			return 'Bạn chưa có lượt trong top tuần này.';
		}
		return `Bạn: #${data.self.rank} · ${data.self.score} điểm`;
	}, [data?.self]);

	return (
		<section className="games-hub-panel">
			<div className="games-hub-panel__header">
				<h3 className="games-hub-panel__title">
					<TrophyOutlined className="mr-2" />
					BXH tuần — {gameTitle}
				</h3>
				<div className="games-hub-panel__actions">
					<Button size="small" icon={<ReloadOutlined />} onClick={() => void load()}>
						Làm mới
					</Button>
					<Button
						size="small"
						type="primary"
						ghost
						onClick={() =>
							router.push(
								vocabularyLeaderboardHref(classId, { promptType, modeId }),
							)
						}
					>
						Xem đầy đủ
					</Button>
				</div>
			</div>

			{error ? <Alert type="error" showIcon message={error} className="mb-3" /> : null}

			{data?.self ? (
				<Alert
					className="mb-3"
					type="info"
					showIcon
					icon={<CrownOutlined />}
					message={selfMessage}
				/>
			) : null}

			{loading ? (
				<Skeleton active paragraph={{ rows: 3 }} />
			) : (
				<Table<DrillLeaderboardPerPlayRow>
					rowKey="playId"
					size="small"
					pagination={false}
					columns={columns}
					dataSource={rows}
					locale={{ emptyText: 'Chưa có lượt tuần này.' }}
				/>
			)}
		</section>
	);
}
