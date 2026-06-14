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
import { resolveReadOnlyNoticeMessage } from '@/features/learning/utils/learning-access';
import {
	vocabularyLeaderboardHref,
	vocabularyPracticeHref,
} from '@/features/learning/utils/vocabulary-session-routes';

const { Text, Paragraph } = Typography;

/** Landing `/learning/games/leaderboard` — chọn lớp rồi mới xem BXH chi tiết. */
export function LeaderboardDashboardView() {
	const router = useRouter();
	const {
		data,
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
	const classAccessNotice = resolveReadOnlyNoticeMessage(selectedClass?.readOnlyReason);
	const needsClassHint = !selectedClassId ? 'Chọn lớp ở trên trước' : undefined;

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

	if (loading) {
		return (
			<div className="learning-dashboard-root">
				<PageHeader title="Bảng xếp hạng" />
				<Skeleton active paragraph={{ rows: 8 }} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="learning-dashboard-root">
				<PageHeader
					title="Bảng xếp hạng"
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
				<PageHeader title="Bảng xếp hạng" />
				<Empty description="Bạn chưa có lớp học nào." />
			</div>
		);
	}

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Bảng xếp hạng"
				description="So sánh điểm game theo lớp hoặc toàn khóa — chọn lớp rồi mở bảng chi tiết."
				extra={
					<Button icon={<ReloadOutlined />} onClick={refresh}>
						Làm mới
					</Button>
				}
			/>

			<Card className="learning-dashboard-context" size="small">
				<Flex vertical gap="small">
					<Text strong>Lớp để xem BXH</Text>
					{classOptions.length > 1 ? (
						<div className="learning-dashboard-class-picker">
							<Select
								className="w-full"
								size="large"
								value={selectedClassId ?? undefined}
								options={classOptions}
								onChange={setSelectedClassId}
								placeholder="Chọn lớp"
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
					) : null}
				</Flex>
			</Card>

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
								disabled={!selectedClassId}
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
					<Card title="Tuần này (game)">
						<div className="learning-dashboard-stats">
							<Statistic
								title="Lượt chơi"
								value={stats?.weekDrillPlays ?? stats?.weekEventCount ?? 0}
							/>
							<Statistic title="Điểm game" value={stats?.weekDrillScore ?? 0} />
						</div>
					</Card>
				</Col>
			</Row>
		</div>
	);
}
