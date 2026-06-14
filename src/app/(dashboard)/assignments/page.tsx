'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Col, Row, Skeleton, Typography, theme } from 'antd';
import {
	ArrowLeftOutlined,
	FileDoneOutlined,
	PlayCircleOutlined,
	ReadOutlined,
	ReloadOutlined,
	UnorderedListOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/layout';
import { LearningDashboardActionCard } from '@/features/learning/components/LearningDashboardActionCard';
import { AssignmentsCourseTree } from '@/features/assignments/components/AssignmentsCourseTree';
import { StudentAssignmentDetailModal } from '@/features/schedule/components/StudentAssignmentDetailModal';
import {
	groupAssignmentsFromOverview,
	type CourseAssignmentGroup,
} from '@/lib/assignments-overview-grouping';
import { extractAssignmentsDue } from '@/lib/learning-assignments-due';
import type { OverviewClassSessions } from '@/types/overview-sessions';

const OVERVIEW_SESSIONS_PATH = '/api/overview/sessions';

type BrowseMode = 'dashboard' | 'list';

export default function StudentAssignmentsPage() {
	const { token } = theme.useToken();
	const { fetchWithAuth } = useAuth();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [groups, setGroups] = useState<CourseAssignmentGroup[]>([]);
	const [dueCount, setDueCount] = useState(0);
	const [modalOpen, setModalOpen] = useState(false);
	const [modalAssignmentId, setModalAssignmentId] = useState<number | null>(null);
	const [browseMode, setBrowseMode] = useState<BrowseMode>('dashboard');

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
			setGroups(groupAssignmentsFromOverview(blocks));
			setDueCount(extractAssignmentsDue(blocks).length);
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Không tải được danh sách bài tập.');
			setGroups([]);
			setDueCount(0);
		} finally {
			setLoading(false);
		}
	}, [fetchWithAuth]);

	useEffect(() => {
		void load();
	}, [load]);

	if (loading && browseMode === 'dashboard') {
		return (
			<div className="learning-dashboard-root">
				<PageHeader title="Bài tập" />
				<Skeleton active paragraph={{ rows: 8 }} />
			</div>
		);
	}

	if (browseMode === 'list') {
		return (
			<div className="learning-dashboard-root">
				<PageHeader
					title="Danh sách bài tập"
					description="Theo khóa học, lớp và buổi — bấm tên bài hoặc điểm để xem chi tiết."
					extra={
						<Button icon={<ArrowLeftOutlined />} onClick={() => setBrowseMode('dashboard')}>
							Về Bài tập
						</Button>
					}
				/>
				{error ? (
					<Alert type="error" message={error} showIcon className="mb-4" />
				) : null}
				<Card>
					{loading ? (
						<Skeleton active paragraph={{ rows: 8 }} />
					) : groups.length === 0 ? (
						<Typography.Text type="secondary">Chưa có bài tập nào.</Typography.Text>
					) : (
						<AssignmentsCourseTree groups={groups} onOpenAssignment={openAssignmentDetail} />
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

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Bài tập"
				description="Deadline GV giao — quiz, drill game, nộp bài. Chọn hành động trước khi duyệt danh sách."
				extra={
					<Button icon={<ReloadOutlined />} onClick={() => void load()}>
						Làm mới
					</Button>
				}
			/>

			{error ? (
				<Alert type="error" message={error} showIcon className="mb-4" />
			) : null}

			<Row gutter={[16, 16]}>
				<Col xs={24} lg={15}>
					<section className="learning-dashboard-actions-section">
						<h2 className="learning-dashboard-section-title">Bạn muốn làm gì?</h2>
						<p className="learning-dashboard-section-subtitle">
							{totalAssignments > 0
								? `${totalAssignments} bài trong các lớp của bạn`
								: 'Chưa có bài — dashboard vẫn hiển thị khi có dữ liệu mới'}
							{dueCount > 0 ? ` · ${dueCount} sắp đến hạn` : ''}
						</p>
						<div className="learning-dashboard-actions-grid">
							<LearningDashboardActionCard
								variant="browse"
								icon={<UnorderedListOutlined />}
								title="Duyệt tất cả bài"
								description="Cây khóa học → lớp → buổi → bài"
								disabled={totalAssignments === 0}
								onClick={() => setBrowseMode('list')}
							/>
							<LearningDashboardActionCard
								variant="play"
								icon={<PlayCircleOutlined />}
								title="Bài game luyện từ"
								description="Drill pool coverage — danh sách bài game riêng"
								onClick={() => router.push('/learning/games/assignments')}
							/>
							<LearningDashboardActionCard
								variant="quiz"
								icon={<FileDoneOutlined />}
								title="Quiz & bài kiểm tra"
								description="Làm bài online, xem điểm & hạn nộp"
								onClick={() => setBrowseMode('list')}
							/>
							<LearningDashboardActionCard
								variant="vocabulary"
								icon={<ReadOutlined />}
								title="Luyện từ vựng"
								description="Flashcard & danh sách từ buổi học"
								onClick={() => router.push('/learning/vocabulary')}
							/>
							<LearningDashboardActionCard
								variant="hub"
								icon={<ArrowLeftOutlined />}
								title="Tổng quan Học tập"
								description="Hub chính & tiến độ tuần"
								onClick={() => router.push('/learning')}
							/>
						</div>
					</section>

					<Card className="mt-4" size="small">
						<Typography.Text strong className="block mb-2">
							Loại bài thường gặp
						</Typography.Text>
						<ul className="learning-dashboard-info-list">
							<li>
								<strong>Quiz online</strong> — làm trên portal, có hạn nộp.
							</li>
							<li>
								<strong>Game drill</strong> — pool coverage qua assignment, có điểm tối thiểu.
							</li>
							<li>
								<strong>Bài tập khác</strong> — xem hướng dẫn GV trong chi tiết bài.
							</li>
						</ul>
					</Card>
				</Col>

				<Col xs={24} lg={9}>
					<Card title="Tóm tắt">
						<div className="learning-dashboard-stats">
							<Card bordered={false} styles={{ body: { padding: '0.5rem 0' } }}>
								<Typography.Text type="secondary">Tổng bài</Typography.Text>
								<div style={{ fontSize: token.fontSizeHeading3, fontWeight: 600 }}>
									{totalAssignments}
								</div>
							</Card>
							<Card bordered={false} styles={{ body: { padding: '0.5rem 0' } }}>
								<Typography.Text type="secondary">Sắp hạn</Typography.Text>
								<div
									style={{
										fontSize: token.fontSizeHeading3,
										fontWeight: 600,
										color: dueCount > 0 ? token.colorWarning : undefined,
									}}
								>
									{dueCount}
								</div>
							</Card>
						</div>
						{dueCount > 0 ? (
							<Button
								type="primary"
								block
								className="mt-3"
								onClick={() => setBrowseMode('list')}
							>
								Xem bài sắp hạn
							</Button>
						) : null}
					</Card>
				</Col>
			</Row>

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
