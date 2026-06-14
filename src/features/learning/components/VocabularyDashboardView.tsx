'use client';

import { useEffect, useMemo } from 'react';
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
	BookOutlined,
	FileDoneOutlined,
	PlayCircleOutlined,
	ReadOutlined,
	ReloadOutlined,
	UnorderedListOutlined,
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
	flashcardSessionHref,
	vocabularyPracticeHref,
	vocabularySessionsBrowseHref,
} from '@/features/learning/utils/vocabulary-session-routes';

const { Text, Paragraph } = Typography;

function formatNearestSessionDate(scheduledDate: string, isToday: boolean): string {
	if (isToday) return 'Hôm nay';
	const parsed = new Date(`${scheduledDate}T12:00:00+07:00`);
	if (Number.isNaN(parsed.getTime())) return scheduledDate;
	return new Intl.DateTimeFormat('vi-VN', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	}).format(parsed);
}

/** Landing `/learning/vocabulary` — chọn action trước, không bắt buộc vào danh sách buổi ngay. */
export function VocabularyDashboardView() {
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
	const nearest = data?.nearestSession ?? data?.todaySession ?? null;
	const nearestClass = nearest
		? data?.classes?.find((c) => c.classId === nearest.classId)
		: null;
	const canFlashcardNearest = hubClassCanRecordEvents(nearestClass);
	const classAccessNotice = resolveReadOnlyNoticeMessage(selectedClass?.readOnlyReason);
	const needsClassHint = !selectedClassId ? 'Chọn lớp ở trên trước' : undefined;

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

	if (loading) {
		return (
			<div className="learning-dashboard-root">
				<PageHeader title="Luyện từ vựng" />
				<Skeleton active paragraph={{ rows: 8 }} />
			</div>
		);
	}

	if (error) {
		return (
			<div className="learning-dashboard-root">
				<PageHeader
					title="Luyện từ vựng"
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
				<PageHeader title="Luyện từ vựng" />
				<Empty description="Bạn chưa có lớp học nào." />
			</div>
		);
	}

	return (
		<div className="learning-dashboard-root">
			<PageHeader
				title="Luyện từ vựng"
				description="Xem từ theo buổi, ôn flashcard hoặc chuyển sang game — chọn hành động phù hợp."
				extra={
					<Button icon={<ReloadOutlined />} onClick={refresh}>
						Làm mới
					</Button>
				}
			/>

			<Card className="learning-dashboard-context" size="small">
				<Flex vertical gap="small">
					<Text strong>Lớp học</Text>
					{classOptions.length > 1 ? (
						<div className="learning-dashboard-class-picker">
							<Select
								className="w-full"
								size="large"
								value={selectedClassId ?? undefined}
								options={classOptions}
								onChange={setSelectedClassId}
								placeholder="Chọn lớp (cho buổi & flashcard)"
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

			{nearest ? (
				<Card className="mt-4 learning-dashboard-featured" size="small">
					<Text type="secondary" className="text-xs uppercase tracking-wide">
						Buổi gần nhất
					</Text>
					<Text strong className="mt-1 block text-base">
						{nearest.title}
					</Text>
					<Text type="secondary" className="text-sm">
						{nearest.className} · {nearest.assetCount} từ ·{' '}
						{formatNearestSessionDate(nearest.scheduledDate, nearest.isToday)}
					</Text>
				</Card>
			) : null}

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
								disabled={!selectedClassId}
								onClick={goSessions}
							/>
							<LearningDashboardActionCard
								variant="flashcard"
								icon={<BookOutlined />}
								title="Luyện flashcard"
								description={
									nearest
										? `Buổi: ${nearest.title}`
										: 'Cần buổi có từ vựng'
								}
								hint={
									!nearest
										? 'Chưa có buổi phù hợp'
										: !canFlashcardNearest
											? 'Lớp chỉ xem'
											: undefined
								}
								disabled={!nearest || !canFlashcardNearest}
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
								description={
									assignmentsDue.length > 0
										? `${assignmentsDue.length} bài sắp hạn`
										: 'Quiz & drill GV giao'
								}
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
					<Card title="Tuần này (từ vựng)">
						<div className="learning-dashboard-stats">
							<Statistic title="Lần luyện" value={stats?.weekEventCount ?? 0} />
							<Statistic title="Từ đã xem" value={stats?.weekUniqueAssetsSeen ?? 0} />
							<Statistic title="Quiz đã làm" value={stats?.weekQuizAttempts ?? 0} />
						</div>
					</Card>
				</Col>
			</Row>
		</div>
	);
}
