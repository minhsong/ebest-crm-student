'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Col, Empty, Row, Typography } from 'antd';
import {
	ArrowLeftOutlined,
	FileDoneOutlined,
	ReloadOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningDashboardActionCard } from '@/features/learning/components/LearningDashboardActionCard';
import { LearningAssignmentsDuePart } from '@/features/learning/components/parts/LearningAssignmentsDuePart';
import { LearningDashboardClassContextCard } from '@/features/learning/components/parts/LearningDashboardClassContextCard';
import {
	GAMES_WEEK_STAT_ITEMS,
	LearningWeekStatsPart,
} from '@/features/learning/components/parts/LearningWeekStatsPart';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import { hubClassCanRecordEvents } from '@/features/learning/utils/learning-access';
import { isLearningHubNoEnrollment } from '@/features/learning/utils/learning-hub-enrollment';
import {
	vocabularyGameAssignmentsHref,
	vocabularyLeaderboardHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import { buildVocabularyDrillStartHref } from '@/lib/assignment-list-row-actions';

const { Text } = Typography;

/** Landing `/learning/games` — shell tĩnh render ngay; stats & bài hạn lazy. */
export function GamesDashboardView() {
	const router = useRouter();
	const {
		data,
		assignmentsDue,
		hubLoading,
		secondaryLoading,
		error,
		refresh,
		selectedClassId,
		setSelectedClassId,
		selectedClass,
	} = useLearningHub();

	const selectedCanRecord = hubClassCanRecordEvents(selectedClass);
	const needsClassHint = !selectedClassId ? 'Chọn lớp ở trên trước' : undefined;
	const noEnrollment = !hubLoading && isLearningHubNoEnrollment(data);

	const drillAssignmentsDue = useMemo(
		() => assignmentsDue.filter((item) => item.exerciseType === 'vocabulary_drill'),
		[assignmentsDue],
	);

	const drillAssignmentsHint =
		!secondaryLoading && drillAssignmentsDue.length > 0
			? `${drillAssignmentsDue.length} bài sắp đến hạn — pool coverage`
			: 'Drill theo bài GV giao — không cần chọn lớp trước';

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

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Game luyện từ"
				description="Chọn chức năng bên dưới. Lớp học dùng cho chơi game và xem bảng xếp hạng — có thể chọn trước hoặc đổi sau."
				extra={
					<Button icon={<ReloadOutlined />} onClick={refresh} loading={hubLoading}>
						Làm mới
					</Button>
				}
			/>

			{error && !hubLoading ? (
				<Alert type="error" showIcon className="mb-4" message={error} />
			) : null}

			{noEnrollment ? (
				<>
					<Empty description="Bạn chưa có lớp học nào. Khi được ghi danh, game luyện từ sẽ hiển thị tại đây." />
					<Button className="mt-4" onClick={goLearningHub}>
						Về Học tập
					</Button>
				</>
			) : (
				<>
					<LearningDashboardClassContextCard
						hub={data}
						hubLoading={hubLoading}
						selectedClassId={selectedClassId}
						onClassChange={setSelectedClassId}
						selectedClass={selectedClass}
						label="Lớp cho game & BXH"
					/>

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
										disabled={hubLoading || !selectedClassId || !selectedCanRecord}
										onClick={goPlayLobby}
									/>
									<LearningDashboardActionCard
										variant="leaderboard"
										icon={<TrophyOutlined />}
										title="Bảng xếp hạng"
										description="Điểm từng lượt, số lượt chơi, câu đúng"
										hint={needsClassHint}
										disabled={hubLoading || !selectedClassId}
										onClick={goLeaderboard}
									/>
									<LearningDashboardActionCard
										variant="assignments"
										icon={<FileDoneOutlined />}
										title="Bài tập game"
										description={drillAssignmentsHint}
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
							<LearningWeekStatsPart
								title="Tuần này (game)"
								loading={hubLoading}
								stats={data?.weekStats}
								items={GAMES_WEEK_STAT_ITEMS}
								gridClassName="learning-dashboard-stats"
							/>

							{secondaryLoading || drillAssignmentsDue.length > 0 ? (
								<LearningAssignmentsDuePart
									className="mt-4"
									title="Bài game sắp hạn"
									loading={secondaryLoading}
									items={drillAssignmentsDue}
									maxItems={3}
									emptyDescription=""
									openButtonLabel="Mở bài tập game"
									emptyButtonLabel="Mở bài tập game"
									onOpenAssignments={goAssignments}
									renderItemAction={(item) => (
										<button
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
									)}
								/>
							) : null}
						</Col>
					</Row>
				</>
			)}
		</div>
	);
}
