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
	FileDoneOutlined,
	FontSizeOutlined,
	ReloadOutlined,
	RiseOutlined,
	ThunderboltOutlined,
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

type HubMenuCardVariant = 'vocabulary' | 'games' | 'assignments' | 'progress';

type HubMenuCardProps = {
	variant: HubMenuCardVariant;
	icon: ReactNode;
	title: string;
	description: string;
	badge?: string;
	disabled?: boolean;
	onClick: () => void;
};

function HubMenuCard({
	variant,
	icon,
	title,
	description,
	badge,
	disabled,
	onClick,
}: HubMenuCardProps) {
	return (
		<button
			type="button"
			className={`learning-hub-menu-card learning-hub-menu-card--${variant}`}
			disabled={disabled}
			onClick={onClick}
		>
			<span className="learning-hub-menu-card__blob learning-hub-menu-card__blob--a" aria-hidden />
			<span className="learning-hub-menu-card__blob learning-hub-menu-card__blob--b" aria-hidden />
			<span className="learning-hub-menu-card__icon-wrap">{icon}</span>
			<span className="learning-hub-menu-card__content">
				<span className="learning-hub-menu-card__title">{title}</span>
				<span className="learning-hub-menu-card__desc">{description}</span>
			</span>
			{badge ? <span className="learning-hub-menu-card__badge">{badge}</span> : null}
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

	const goGames = () => {
		if (!selectedClassId) return;
		router.push(vocabularyPracticeHref(selectedClassId));
	};

	const goAllSessions = () => {
		router.push(vocabularyHomeHref(selectedClassId ?? undefined));
	};

	const goAssignments = () => {
		router.push('/assignments');
	};

	const goProgress = () => {
		document.getElementById('learning-hub-progress')?.scrollIntoView({
			behavior: 'smooth',
			block: 'start',
		});
	};

	return (
		<div className="learning-hub-root">
			<PageHeader
				title="Học tập"
				description="Ôn từ vựng, chơi game luyện từ, làm bài tập — chạm một lần để bắt đầu."
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

					<section className="learning-hub-primary-section">
						<div className="learning-hub-section-head">
							<h2 className="learning-hub-section-title">Chức năng chính</h2>
							<p className="learning-hub-section-subtitle">
								Chọn một mục để bắt đầu học ngay
							</p>
						</div>
						<div className="learning-hub-menu-grid learning-hub-menu-grid--primary">
							<HubMenuCard
								variant="vocabulary"
								icon={<FontSizeOutlined />}
								title="Từ vựng"
								description="Buổi học, danh sách từ, flashcard"
								onClick={goAllSessions}
							/>
							<HubMenuCard
								variant="games"
								icon={<ThunderboltOutlined />}
								title="Game luyện từ"
								description="Survival, bài drill, từ hay sai"
								disabled={!canOpenPractice || !selectedCanRecord}
								onClick={goGames}
							/>
							<HubMenuCard
								variant="assignments"
								icon={<FileDoneOutlined />}
								title="Bài tập"
								description={
									assignmentsDue.length > 0
										? `${assignmentsDue.length} bài sắp đến hạn`
										: 'Xem deadline & nộp bài'
								}
								badge={assignmentsDue.length > 0 ? String(assignmentsDue.length) : undefined}
								onClick={goAssignments}
							/>
							<HubMenuCard
								variant="progress"
								icon={<RiseOutlined />}
								title="Tiến độ tuần"
								description="Lần luyện, từ đã xem, game tuần này"
								onClick={goProgress}
							/>
						</div>
					</section>
				</Col>

				<Col xs={24} lg={10}>
					<Card id="learning-hub-progress" title="Tuần này">
						<div className="learning-hub-stats-grid">
							<Statistic title="Lần luyện" value={stats?.weekEventCount ?? 0} />
							<Statistic title="Từ đã xem" value={stats?.weekUniqueAssetsSeen ?? 0} />
							<Statistic title="Quiz đã làm" value={stats?.weekQuizAttempts ?? 0} />
							<Statistic title="Điểm game tuần" value={stats?.weekDrillScore ?? 0} />
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
