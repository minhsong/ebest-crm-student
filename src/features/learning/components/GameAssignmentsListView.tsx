'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Skeleton, Typography } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/layout';
import { AssignmentsCourseTree } from '@/features/assignments/components/AssignmentsCourseTree';
import { StudentAssignmentDetailModal } from '@/features/schedule/components/StudentAssignmentDetailModal';
import {
	filterVocabularyDrillAssignmentGroups,
	groupAssignmentsFromOverview,
} from '@/lib/assignments-overview-grouping';
import type { OverviewClassSessions } from '@/types/overview-sessions';

const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';

/** Danh sách bài tập game (vocabulary drill) — filter từ overview, có nút Làm bài. */
export function GameAssignmentsListView() {
	const { fetchWithAuth } = useAuth();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [groups, setGroups] = useState(
		() => [] as ReturnType<typeof filterVocabularyDrillAssignmentGroups>,
	);
	const [modalOpen, setModalOpen] = useState(false);
	const [modalAssignmentId, setModalAssignmentId] = useState<number | null>(null);

	const totalAssignments = useMemo(
		() =>
			groups.reduce(
				(sum, g) =>
					sum +
					g.classes.reduce(
						(cSum, c) =>
							cSum + c.sessions.reduce((sSum, s) => sSum + s.assignments.length, 0),
						0,
					),
				0,
			),
		[groups],
	);

	const openAssignmentDetail = useCallback((assignmentId: number) => {
		setModalAssignmentId(assignmentId);
		setModalOpen(true);
	}, []);

	const load = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const res = await fetchWithAuth(OVERVIEW_SESSIONS_PATH);
			const data = (await res.json().catch(() => [])) as unknown;
			const blocks = Array.isArray(data) ? (data as OverviewClassSessions[]) : [];
			setGroups(filterVocabularyDrillAssignmentGroups(groupAssignmentsFromOverview(blocks)));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Không tải được danh sách bài game.');
			setGroups([]);
		} finally {
			setLoading(false);
		}
	}, [fetchWithAuth]);

	useEffect(() => {
		void load();
	}, [load]);

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Bài tập game"
				description="Luyện từ theo bài GV giao — pool coverage, có điểm tối thiểu và đồng bộ sổ điểm."
				extra={
					<>
						<Button icon={<ReloadOutlined />} onClick={() => void load()}>
							Làm mới
						</Button>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={() => router.push('/learning/games')}
						>
							Về Game luyện từ
						</Button>
					</>
				}
			/>

			{error ? <Alert type="error" message={error} showIcon className="mb-4" /> : null}

			<Card>
				{loading ? (
					<Skeleton active paragraph={{ rows: 8 }} />
				) : groups.length === 0 ? (
					<Typography.Text type="secondary">
						Chưa có bài tập game nào. Khi GV giao bài luyện từ, danh sách hiển thị tại đây.
					</Typography.Text>
				) : (
					<>
						<Typography.Text type="secondary" className="block mb-3">
							{totalAssignments} bài game trong các lớp của bạn
						</Typography.Text>
						<AssignmentsCourseTree
							groups={groups}
							onOpenAssignment={openAssignmentDetail}
							showRowActions
						/>
					</>
				)}
			</Card>

			<StudentAssignmentDetailModal
				open={modalOpen}
				assignmentId={modalAssignmentId}
				onClose={() => {
					setModalOpen(false);
					setModalAssignmentId(null);
				}}
			/>
		</div>
	);
}
