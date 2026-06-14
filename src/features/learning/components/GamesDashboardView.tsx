'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	Button,
	Card,
	Col,
	Empty,
	Flex,
	Row,
	Select,
	Skeleton,
	Statistic,
	Typography,
} from 'antd';
import {
	ArrowLeftOutlined,
	FileDoneOutlined,
	ReloadOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningDashboardActionCard } from '@/features/learning/components/LearningDashboardActionCard';
import {
	LearningAccessNotice,
	LearningAccessNoticeInline,
} from '@/features/learning/components/LearningAccessNotice';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import {
	hubClassCanRecordEvents,
	resolveReadOnlyNoticeMessage,
} from '@/features/learning/utils/learning-access';
import {
	vocabularyGameAssignmentsHref,
	vocabularyLeaderboardHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { buildVocabularyDrillStartHref } from '@/lib/assignment-list-row-actions';

const { Text, Paragraph } = Typography;

/** Landing `/learning/games` — chọn lớp (tuỳ chọn) rồi chọn action, không load pool ngay. */
export function GamesDashboardView() {
	const router = useRouter();
	const {
		data,
		assignmentsDue,
		loading,
		error,
		refresh,
		selectedClassId,
		setSelectedClassId,
		selectedClass,
	} = useLearningHub();

	const classOptions = useMemo(
		() =>
			(data?.classes ?? []).map((c) => ({
				value: c.classId,
				label:
					c.interactionMode === 'read_only'
						? `${c.className} (Chỉ xem)`
						: c.className,
			})),
		[data?.classes],
	);

	const stats = data?.weekStats;
	const selectedCanRecord = hubClassCanRecordEvents(selectedClass);
	const classAccessNotice = resolveReadOnlyNoticeMessage(selectedClass?.readOnlyReason);
	const needsClassHint = !selectedClassId ? 'Chọn lớp ở trên trước' : undefined;

	const drillAssignmentsDue = useMemo(
		() => assignmentsDue.filter((item) => item.exerciseType === 'vocabulary_drill'),
		[assignmentsDue],
	);

	const goPlayLobby = () => {
		if (!selectedClassId) return;
		router.push(vocabularyPracticeHref(selectedClassId));
	};

	const goLeaderboard = () => {
		if (!selectedClassId) return;
		router.push(vocabularyLeaderboardHref(selectedClassId));
	};

	const goAssignments = () => {
		router.push(vocabularyGameAssignmentsHref());
	};

	const goLearningHub = () => {
		router.push('/learning');
	};

	if (loading) {
		return (
			<div className="learning-dashboard-root">
				<PageHeader title="Game luyện từ" />
				<Skeleton active paragraph={{ rows: 8 }} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="learning-dashboard-root">
				<PageHeader
					title="Game luyện từ"
					extra={
						<Button icon={<ReloadOutlined />} onClick={refresh}>
							Thử lại
						</Button>
					}
				/>
				<Alert type="error" showIcon message={error} />
			</div>
		);
	}

	if (
		data?.context?.messageCode === 'NO_ENROLLMENT' ||
		data?.context?.messageCode === 'NO_ACTIVE_ENROLLMENT'
	) {
		return (
			<div className="learning-dashboard-root">
				<PageHeader title="Game luyện từ" />
				<Empty description="Bạn chưa có lớp học nào. Khi được ghi danh, game luyện từ sẽ hiển thị tại đây." />
				<Button className="mt-4" onClick={goLearningHub}>
					Về Học tập
				</Button>
			</div>
		);
	}

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Game luyện từ"
				description="Chọn chức năng bên dưới. Lớp học dùng cho chơi game và xem bảng xếp hạng — có thể chọn trước hoặc đổi sau."
				extra={
					<Button icon={<ReloadOutlined />} onClick={refresh}>
						Làm mới
					</Button>
				}
			/>

			<Card className="learning-dashboard-context" size="small">
				<Flex vertical gap="small">
					<Text strong>Lớp cho game &amp; BXH</Text>
					{classOptions.length > 1 ? (
						<div className="learning-dashboard-class-picker">
							<Select
								className="w-full"
								size="large"
								value={selectedClassId ?? undefined}
								options={classOptions}
								onChange={setSelectedClassId}
								placeholder="Chọn lớp (tuỳ chọn trước khi chơi)"
							/>
							{classAccessNotice ? (
								<LearningAccessNotice message={classAccessNotice} />
							) : null}
						</div>
					) : selectedClass ? (
						<Paragraph type="secondary" className="!mb-0">
							<LearningAccessNoticeInline message={classAccessNotice}>
								<span>
									Lớp: <Text strong>{selectedClass.className}</Text>
								</span>
							</LearningAccessNoticeInline>
						</Paragraph>
					) : (
						<Text type="secondary">Chưa có lớp phù hợp.</Text>
					)}
				</Flex>
			</Card>

			<Row gutter={[16, 16]} className="mt-4">
				<Col xs={24} lg={15}>
					<section className="learning-dashboard-actions-section">
						<h2 className="learning-dashboard-section-title">Bạn muốn làm gì?</h2>
						<div className="learning-dashboard-actions-grid">
							<LearningDashboardActionCard
								variant="play"
								icon={<ThunderboltOutlined />}
								title="Chơi luyện từ"
								description="Survival, MCQ nghe / nghĩa — chọn mode trong lobby"
								hint={needsClassHint}
								disabled={!selectedClassId || !selectedCanRecord}
								onClick={goPlayLobby}
							/>
							<LearningDashboardActionCard
								variant="leaderboard"
								icon={<TrophyOutlined />}
								title="Bảng xếp hạng"
								description="Điểm từng lượt, số lượt chơi, câu đúng"
								hint={needsClassHint}
								disabled={!selectedClassId}
								onClick={goLeaderboard}
							/>
							<LearningDashboardActionCard
								variant="assignments"
								icon={<FileDoneOutlined />}
								title="Bài tập game"
								description={
									drillAssignmentsDue.length > 0
										? `${drillAssignmentsDue.length} bài sắp đến hạn — pool coverage`
										: 'Drill theo bài GV giao — không cần chọn lớp trước'
								}
								onClick={goAssignments}
							/>
							<LearningDashboardActionCard
								variant="hub"
								icon={<ArrowLeftOutlined />}
								title="Về Học tập"
								description="Từ vựng, flashcard và tổng quan tuần"
								onClick={goLearningHub}
							/>
						</div>
					</section>

					<Card className="mt-4" size="small">
						<Text strong className="block mb-2">
							Giới thiệu nhanh
						</Text>
						<ul className="learning-dashboard-info-list">
							<li>
								<strong>Survival</strong> — luyện tự do theo pool từ đã mở khóa của lớp.
							</li>
							<li>
								<strong>Pool coverage</strong> — thường qua bài tập; có điểm tối thiểu và nộp
								sổ điểm.
							</li>
							<li>
								<strong>BXH</strong> — theo lớp hoặc toàn khóa; cần chọn lớp để so sánh đúng
								nhóm.
							</li>
						</ul>
					</Card>
				</Col>

				<Col xs={24} lg={9}>
					<Card title="Tuần này (game)">
						<div className="learning-dashboard-stats">
							<Statistic
								title="Lượt chơi"
								value={stats?.weekDrillPlays ?? stats?.weekEventCount ?? 0}
							/>
							<Statistic title="Điểm game" value={stats?.weekDrillScore ?? 0} />
						</div>
					</Card>

					{drillAssignmentsDue.length > 0 ? (
						<Card className="mt-4" title="Bài game sắp hạn" size="small">
							{drillAssignmentsDue.slice(0, 3).map((item) => (
								<button
									key={item.assignmentId}
									type="button"
									className="learning-dashboard-due-item learning-dashboard-due-item--clickable"
									onClick={() =>
										router.push(
											buildVocabularyDrillStartHref(item.classId, item.assignmentId),
										)
									}
								>
									<Text strong className="text-sm">
										{item.title}
									</Text>
									<Text type="secondary" className="text-xs block">
										{item.className}
									</Text>
								</button>
							))}
							<Button type="primary" block className="mt-3" onClick={goAssignments}>
								Mở bài tập game
							</Button>
						</Card>
					) : null}
				</Col>
			</Row>
		</div>
	);
}
