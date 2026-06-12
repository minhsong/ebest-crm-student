'use client';

import { useMemo, type ReactNode } from 'react';
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
	BookOutlined,
	CalendarOutlined,
	FileTextOutlined,
	ReloadOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
	UnorderedListOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import {
	LearningAccessNotice,
	LearningAccessNoticeInline,
} from '@/features/learning/components/LearningAccessNotice';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import {
	hubClassCanRecordEvents,
	resolveReadOnlyNoticeMessage,
} from '@/features/learning/utils/learning-access';
import { LearningRecommendationCards } from '@/features/learning/components/LearningRecommendationCards';
import { formatAssignmentDeadline } from '@/lib/learning-assignments-due';
import {
	flashcardSessionHref,
	vocabularyHomeHref,
	vocabularyPracticeHref,
	vocabularySessionDetailHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import './learning-hub.css';

const { Text, Paragraph } = Typography;

function formatNearestSessionDate(scheduledDate: string, isToday: boolean): string {
	if (isToday) {
		return 'Hôm nay';
	}
	const parsed = new Date(`${scheduledDate}T12:00:00+07:00`);
	if (Number.isNaN(parsed.getTime())) {
		return scheduledDate;
	}
	return new Intl.DateTimeFormat('vi-VN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(parsed);
}

type HubMenuCardProps = {
	icon: ReactNode;
	title: string;
	description: string;
	disabled?: boolean;
	onClick: () => void;
};

function HubMenuCard({ icon, title, description, disabled, onClick }: HubMenuCardProps) {
	return (
		<button
			type="button"
			className="learning-hub-menu-card"
			disabled={disabled}
			onClick={onClick}
		>
			<span className="learning-hub-menu-card__icon">{icon}</span>
			<span className="learning-hub-menu-card__title">{title}</span>
			<span className="learning-hub-menu-card__desc">{description}</span>
		</button>
	);
}

export function LearningHubView() {
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

	const nearest = data?.nearestSession ?? data?.todaySession ?? null;
	const stats = data?.weekStats;

	const nearestClass = nearest
		? data?.classes?.find((c) => c.classId === nearest.classId)
		: null;
	const canFlashcardNearest = hubClassCanRecordEvents(nearestClass);
	const selectedCanRecord = hubClassCanRecordEvents(selectedClass);
	const canOpenPractice = Boolean(selectedClassId && selectedClass);

	const classAccessNotice = resolveReadOnlyNoticeMessage(selectedClass?.readOnlyReason);

	if (loading) {
		return (
			<div className="learning-hub-root">
				<PageHeader title="Học tập" />
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="learning-hub-root">
				<PageHeader
					title="Học tập"
					extra={
						<Button icon={<ReloadOutlined />} onClick={refresh}>
							Thử lại
						</Button>
					}
				/>
				<Alert
					type="error"
					showIcon
					message={error}
					description="Nếu tính năng chưa bật, vui lòng liên hệ trung tâm."
				/>
			</div>
		);
	}

	if (
		data?.context?.messageCode === 'NO_ENROLLMENT' ||
		data?.context?.messageCode === 'NO_ACTIVE_ENROLLMENT'
	) {
		return (
			<div className="learning-hub-root">
				<PageHeader title="Học tập" />
				<Empty description="Bạn chưa có lớp học nào. Khi được ghi danh, nội dung luyện tập sẽ hiển thị tại đây." />
			</div>
		);
	}

	const goFlashcard = () => {
		if (!nearest) return;
		router.push(flashcardSessionHref(nearest.classId, nearest.classSessionId));
	};

	const goWordList = () => {
		if (!nearest) return;
		router.push(vocabularySessionDetailHref(nearest.classId, nearest.classSessionId));
	};

	const goPractice = () => {
		if (!selectedClassId) return;
		router.push(vocabularyPracticeHref(selectedClassId));
	};

	const goLeaderboard = () => {
		if (!selectedClassId) return;
		router.push(`/learning/leaderboard?classId=${selectedClassId}`);
	};

	const goAllSessions = () => {
		router.push(vocabularyHomeHref(selectedClassId ?? undefined));
	};

	const goAssignments = () => {
		router.push('/assignments');
	};

	return (
		<div className="learning-hub-root">
			<PageHeader
				title="Học tập"
				description="Ôn từ vựng, chơi Survival và theo dõi tiến độ — chạm một lần để bắt đầu."
				extra={
					<Button icon={<ReloadOutlined />} onClick={refresh}>
						Làm mới
					</Button>
				}
			/>

			{classOptions.length > 1 ? (
				<div className="learning-hub-class-picker">
					<Text type="secondary" className="mb-1 block text-sm">
						Lớp học
					</Text>
					<div className="learning-hub-class-picker__row">
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

			<Row gutter={[16, 16]}>
				<Col xs={24} lg={14}>
					<Card
						className="learning-hub-featured"
						title={
							<span>
								<BookOutlined className="mr-2" />
								Từ vựng gần nhất
							</span>
						}
					>
						{nearest ? (
							<>
								<div className="learning-hub-featured__meta">
									<Text strong className="text-base">
										{nearest.title}
									</Text>
									<Text type="secondary">
										{nearest.className} · {nearest.assetCount} từ ·{' '}
										{formatNearestSessionDate(
											nearest.scheduledDate,
											nearest.isToday,
										)}
									</Text>
								</div>
								<div className="learning-hub-featured__actions">
									<Button
										type="primary"
										size="large"
										block
										icon={<BookOutlined />}
										disabled={!canFlashcardNearest}
										onClick={goFlashcard}
									>
										Luyện flashcard
									</Button>
									<Button
										size="large"
										block
										icon={<UnorderedListOutlined />}
										onClick={goWordList}
									>
										Xem danh sách từ
									</Button>
								</div>
							</>
						) : (
							<Flex vertical gap="middle">
								<Empty
									image={Empty.PRESENTED_IMAGE_SIMPLE}
									description="Chưa có buổi nào có từ vựng để ôn. Hãy xem danh sách buổi học."
								/>
								<Button size="large" block onClick={goAllSessions}>
									Xem tất cả buổi
								</Button>
							</Flex>
						)}
					</Card>

					<Card className="mt-4" title="Luyện tập nhanh">
						<div className="learning-hub-menu-grid">
							<HubMenuCard
								icon={<ThunderboltOutlined />}
								title="Survival"
								description="Game luyện từ — pool đã mở khóa"
								disabled={!canOpenPractice || !selectedCanRecord}
								onClick={goPractice}
							/>
							<HubMenuCard
								icon={<TrophyOutlined />}
								title="Bảng xếp hạng"
								description="Điểm Survival tuần / tháng"
								disabled={!canOpenPractice}
								onClick={goLeaderboard}
							/>
							<HubMenuCard
								icon={<CalendarOutlined />}
								title="Tất cả buổi"
								description="Danh sách từ theo buổi học"
								onClick={goAllSessions}
							/>
							<HubMenuCard
								icon={<FileTextOutlined />}
								title="Bài tập"
								description={
									assignmentsDue.length > 0
										? `${assignmentsDue.length} bài sắp đến hạn`
										: 'Xem deadline & nộp bài'
								}
								onClick={goAssignments}
							/>
						</div>
					</Card>
				</Col>

				<Col xs={24} lg={10}>
					<Card title="Tuần này">
						<div className="learning-hub-stats-grid">
							<Statistic title="Lần luyện" value={stats?.weekEventCount ?? 0} />
							<Statistic title="Từ đã xem" value={stats?.weekUniqueAssetsSeen ?? 0} />
							<Statistic title="Quiz đã làm" value={stats?.weekQuizAttempts ?? 0} />
							<Statistic title="Điểm drill tuần" value={stats?.weekDrillScore ?? 0} />
						</div>
					</Card>

					<Card className="mt-4" title="Bài sắp đến hạn">
						{assignmentsDue.length > 0 ? (
							<>
								{assignmentsDue.slice(0, 4).map((item) => (
									<div key={item.assignmentId} className="learning-hub-assignment-item">
										<Text strong>{item.title}</Text>
										<Text type="secondary" className="text-sm">
											{item.className} · {item.sessionTitle}
										</Text>
										<Text className="text-sm">
											Hạn:{' '}
											<Text strong>{formatAssignmentDeadline(item.deadline)}</Text>
										</Text>
									</div>
								))}
								<Button
									type="primary"
									size="large"
									block
									className="mt-3"
									onClick={goAssignments}
								>
									Mở trang Bài tập
								</Button>
							</>
						) : (
							<Flex vertical gap="small">
								<Text type="secondary">Không có bài sắp đến hạn trong vài ngày tới.</Text>
								<Button size="large" block onClick={goAssignments}>
									Xem tất cả bài tập
								</Button>
							</Flex>
						)}
					</Card>

					{data?.recommendations?.length ? (
						<div className="mt-4">
							<LearningRecommendationCards items={data.recommendations} />
						</div>
					) : null}
				</Col>
			</Row>
		</div>
	);
}
