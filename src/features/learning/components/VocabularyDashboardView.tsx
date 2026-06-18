'use client';

import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Col, Empty, Row, Typography } from 'antd';
import {
	ArrowLeftOutlined,
	BookOutlined,
	FileDoneOutlined,
	PlayCircleOutlined,
	ReloadOutlined,
	UnorderedListOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningDashboardActionCard } from '@/features/learning/components/LearningDashboardActionCard';
import { LearningDashboardClassContextCard } from '@/features/learning/components/parts/LearningDashboardClassContextCard';
import { LearningNearestSessionBannerPart } from '@/features/learning/components/parts/LearningNearestSessionBannerPart';
import {
	LearningWeekStatsPart,
	VOCABULARY_WEEK_STAT_ITEMS,
} from '@/features/learning/components/parts/LearningWeekStatsPart';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import { hubClassCanRecordEvents } from '@/features/learning/utils/learning-access';
import { isLearningHubNoEnrollment } from '@/features/learning/utils/learning-hub-enrollment';
import {
	flashcardSessionHref,
	vocabularyPracticeHref,
	vocabularySessionsBrowseHref,
} from '@/features/learning/utils/vocabulary-session-routes';

const { Text } = Typography;

/** Landing `/learning/vocabulary` — shell tĩnh render ngay; hub data lazy theo part. */
export function VocabularyDashboardView() {
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

	const nearest = data?.nearestSession ?? data?.todaySession ?? null;
	const nearestClass = nearest
		? data?.classes?.find((c) => c.classId === nearest.classId)
		: null;
	const canFlashcardNearest = hubClassCanRecordEvents(nearestClass);
	const needsClassHint = !selectedClassId ? 'Chọn lớp ở trên trước' : undefined;
	const noEnrollment = !hubLoading && isLearningHubNoEnrollment(data);

	const goSessions = () => {
		if (!selectedClassId) return;
		router.push(vocabularySessionsBrowseHref(selectedClassId));
	};

	const goFlashcardNearest = () => {
		if (!nearest || !canFlashcardNearest) return;
		router.push(flashcardSessionHref(nearest.classId, nearest.classSessionId));
	};

	const goGames = () => {
		if (selectedClassId) {
			router.push(vocabularyPracticeHref(selectedClassId));
			return;
		}
		router.push('/learning/games');
	};

	const goLearningHub = () => {
		router.push('/learning');
	};

	const goAssignments = () => {
		router.push('/assignments');
	};

	const assignmentsHint =
		!secondaryLoading && assignmentsDue.length > 0
			? `${assignmentsDue.length} bài sắp hạn`
			: 'Quiz & drill GV giao';

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Luyện từ vựng"
				description="Xem từ theo buổi, ôn flashcard hoặc chuyển sang game — chọn hành động phù hợp."
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
				<Empty description="Bạn chưa có lớp học nào." />
			) : (
				<>
					<LearningDashboardClassContextCard
						hub={data}
						hubLoading={hubLoading}
						selectedClassId={selectedClassId}
						onClassChange={setSelectedClassId}
						selectedClass={selectedClass}
						label="Lớp học"
					/>

					<LearningNearestSessionBannerPart
						loading={hubLoading}
						nearest={nearest}
					/>

					<Row gutter={[16, 16]} className="mt-4">
						<Col xs={24} lg={15}>
							<section className="learning-dashboard-actions-section">
								<h2 className="learning-dashboard-section-title">Bạn muốn làm gì?</h2>
								<div className="learning-dashboard-actions-grid">
									<LearningDashboardActionCard
										variant="sessions"
										icon={<UnorderedListOutlined />}
										title="Xem buổi & danh sách từ"
										description="Duyệt buổi học, mở card từ và chi tiết"
										hint={needsClassHint}
										disabled={hubLoading || !selectedClassId}
										onClick={goSessions}
									/>
									<LearningDashboardActionCard
										variant="flashcard"
										icon={<BookOutlined />}
										title="Luyện flashcard"
										description={
											nearest && !hubLoading
												? `Buổi: ${nearest.title}`
												: 'Cần buổi có từ vựng'
										}
										hint={
											hubLoading
												? undefined
												: !nearest
													? 'Chưa có buổi phù hợp'
													: !canFlashcardNearest
														? 'Lớp chỉ xem'
														: undefined
										}
										disabled={hubLoading || !nearest || !canFlashcardNearest}
										onClick={goFlashcardNearest}
									/>
									<LearningDashboardActionCard
										variant="play"
										icon={<PlayCircleOutlined />}
										title="Game luyện từ"
										description="Survival & MCQ — sang trang Game"
										onClick={goGames}
									/>
									<LearningDashboardActionCard
										variant="assignments"
										icon={<FileDoneOutlined />}
										title="Bài tập liên quan"
										description={assignmentsHint}
										onClick={goAssignments}
									/>
									<LearningDashboardActionCard
										variant="hub"
										icon={<ArrowLeftOutlined />}
										title="Tổng quan Học tập"
										description="Hub chính & gợi ý tuần"
										onClick={goLearningHub}
									/>
								</div>
							</section>

							<Card className="mt-4" size="small">
								<Text strong className="block mb-2">
									Gợi ý nhanh
								</Text>
								<ul className="learning-dashboard-info-list">
									<li>
										<strong>Danh sách từ</strong> — theo từng buổi, có ảnh, IPA và ví dụ.
									</li>
									<li>
										<strong>Flashcard</strong> — ôn nhanh buổi gần nhất (hoặc chọn buổi trong
										danh sách).
									</li>
									<li>
										<strong>Game</strong> — luyện pool cả lớp; không thay thế xem từ từng buổi.
									</li>
								</ul>
							</Card>
						</Col>

						<Col xs={24} lg={9}>
							<LearningWeekStatsPart
								title="Tuần này (từ vựng)"
								loading={hubLoading}
								stats={data?.weekStats}
								items={VOCABULARY_WEEK_STAT_ITEMS}
								gridClassName="learning-dashboard-stats"
							/>
						</Col>
					</Row>
				</>
			)}
		</div>
	);
}
