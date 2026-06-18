'use client';

import { useRouter } from 'next/navigation';
import { Alert, Button, Card, Col, Empty, Row, Typography } from 'antd';
import {
	ArrowLeftOutlined,
	ReloadOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningDashboardActionCard } from '@/features/learning/components/LearningDashboardActionCard';
import { LearningDashboardClassContextCard } from '@/features/learning/components/parts/LearningDashboardClassContextCard';
import {
	GAMES_WEEK_STAT_ITEMS,
	LearningWeekStatsPart,
} from '@/features/learning/components/parts/LearningWeekStatsPart';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import { isLearningHubNoEnrollment } from '@/features/learning/utils/learning-hub-enrollment';
import {
	vocabularyLeaderboardHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';

const { Text } = Typography;

/** Landing `/learning/games/leaderboard` — shell tĩnh render ngay. */
export function LeaderboardDashboardView() {
	const router = useRouter();
	const {
		data,
		hubLoading,
		error,
		refresh,
		selectedClassId,
		setSelectedClassId,
		selectedClass,
	} = useLearningHub();

	const needsClassHint = !selectedClassId ? 'Chọn lớp ở trên trước' : undefined;
	const noEnrollment = !hubLoading && isLearningHubNoEnrollment(data);

	const goViewLeaderboard = () => {
		if (!selectedClassId) return;
		router.push(vocabularyLeaderboardHref(selectedClassId));
	};

	const goPlay = () => {
		if (selectedClassId) {
			router.push(vocabularyPracticeHref(selectedClassId));
			return;
		}
		router.push('/learning/games');
	};

	const goGamesHub = () => {
		router.push('/learning/games');
	};

	const goLearningHub = () => {
		router.push('/learning');
	};

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Bảng xếp hạng"
				description="So sánh điểm game theo lớp hoặc toàn khóa — chọn lớp rồi mở bảng chi tiết."
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
						label="Lớp để xem BXH"
					/>

					<Row gutter={[16, 16]} className="mt-4">
						<Col xs={24} lg={15}>
							<section className="learning-dashboard-actions-section">
								<h2 className="learning-dashboard-section-title">Bạn muốn làm gì?</h2>
								<div className="learning-dashboard-actions-grid">
									<LearningDashboardActionCard
										variant="leaderboard"
										icon={<TrophyOutlined />}
										title="Xem bảng xếp hạng"
										description="Điểm từng lượt, số lượt chơi, câu đúng — lớp & khóa"
										hint={needsClassHint}
										disabled={hubLoading || !selectedClassId}
										onClick={goViewLeaderboard}
									/>
									<LearningDashboardActionCard
										variant="play"
										icon={<ThunderboltOutlined />}
										title="Chơi thêm để lên hạng"
										description="Mở lobby game luyện từ"
										onClick={goPlay}
									/>
									<LearningDashboardActionCard
										variant="hub"
										icon={<ArrowLeftOutlined />}
										title="Trang Game"
										description="Dashboard game & chọn mode"
										onClick={goGamesHub}
									/>
									<LearningDashboardActionCard
										variant="hub"
										icon={<ArrowLeftOutlined />}
										title="Tổng quan Học tập"
										description="Hub chính học tập"
										onClick={goLearningHub}
									/>
								</div>
							</section>

							<Card className="mt-4" size="small">
								<Text strong className="block mb-2">
									Cách đọc BXH
								</Text>
								<ul className="learning-dashboard-info-list">
									<li>
										<strong>Điểm từng lượt</strong> — mỗi lần chơi Survival / drill (LB-V2).
									</li>
									<li>
										<strong>Số lượt chơi</strong> — tổng lượt đã hoàn thành trong kỳ.
									</li>
									<li>
										<strong>Toàn khóa</strong> — gom mọi lớp cùng khóa học.
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
						</Col>
					</Row>
				</>
			)}
		</div>
	);
}
