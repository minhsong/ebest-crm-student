'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button, Col, Empty, Row } from 'antd';
import {
	BookOutlined,
	FileDoneOutlined,
	FontSizeOutlined,
	ReloadOutlined,
	RiseOutlined,
	ThunderboltOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { LearningAssignmentsDuePart } from '@/features/learning/components/parts/LearningAssignmentsDuePart';
import { LearningHubClassPickerPart } from '@/features/learning/components/parts/LearningHubClassPickerPart';
import { LearningHubFeaturedSessionPart } from '@/features/learning/components/parts/LearningHubFeaturedSessionPart';
import { LearningHubRecommendationsPart } from '@/features/learning/components/parts/LearningHubRecommendationsPart';
import {
	LEARNING_HUB_WEEK_STAT_ITEMS,
	LearningWeekStatsPart,
} from '@/features/learning/components/parts/LearningWeekStatsPart';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import { hubClassCanRecordEvents } from '@/features/learning/utils/learning-access';
import { isLearningHubNoEnrollment } from '@/features/learning/utils/learning-hub-enrollment';
import {
	flashcardSessionHref,
	vocabularyHomeHref,
	vocabularyPracticeHref,
	vocabularySessionDetailHref,
} from '@/features/learning/utils/vocabulary-session-routes';
import './learning-hub.css';

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
	const selectedCanRecord = hubClassCanRecordEvents(selectedClass);
	const canOpenPractice = Boolean(selectedClassId && selectedClass);
	const noEnrollment = !hubLoading && isLearningHubNoEnrollment(data);

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

	const assignmentsBadge =
		!secondaryLoading && assignmentsDue.length > 0
			? String(assignmentsDue.length)
			: undefined;

	return (
		<div className="learning-hub-root">
			<PageHeader
				title="Học tập"
				description="Ôn từ vựng, chơi game luyện từ, làm bài tập — chạm một lần để bắt đầu."
				extra={
					<Button icon={<ReloadOutlined />} onClick={refresh} loading={hubLoading}>
						Làm mới
					</Button>
				}
			/>

			{error && !hubLoading ? (
				<Alert
					type="error"
					showIcon
					className="mb-4"
					message={error}
					description="Nếu tính năng chưa bật, vui lòng liên hệ trung tâm."
					action={
						<Button size="small" onClick={refresh}>
							Thử lại
						</Button>
					}
				/>
			) : null}

			{noEnrollment ? (
				<Empty description="Bạn chưa có lớp học nào. Khi được ghi danh, nội dung luyện tập sẽ hiển thị tại đây." />
			) : (
				<>
					<LearningHubClassPickerPart
						hub={data}
						loading={hubLoading}
						selectedClassId={selectedClassId}
						onClassChange={setSelectedClassId}
						selectedClass={selectedClass}
					/>

					<Row gutter={[16, 16]}>
						<Col xs={24} lg={14}>
							<LearningHubFeaturedSessionPart
								loading={hubLoading}
								nearest={nearest}
								canFlashcard={canFlashcardNearest}
								onFlashcard={goFlashcard}
								onWordList={goWordList}
								onBrowseAllSessions={goAllSessions}
							/>

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
										disabled={hubLoading || !canOpenPractice || !selectedCanRecord}
										onClick={goGames}
									/>
									<HubMenuCard
										variant="assignments"
										icon={<FileDoneOutlined />}
										title="Bài tập"
										description={
											assignmentsBadge
												? `${assignmentsDue.length} bài sắp đến hạn`
												: 'Xem deadline & nộp bài'
										}
										badge={assignmentsBadge}
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
							<LearningWeekStatsPart
								id="learning-hub-progress"
								className="learning-hub-progress-card"
								loading={hubLoading}
								stats={data?.weekStats}
								items={LEARNING_HUB_WEEK_STAT_ITEMS}
							/>

							<LearningAssignmentsDuePart
								className="mt-4"
								loading={secondaryLoading}
								items={assignmentsDue}
								onOpenAssignments={goAssignments}
							/>

							<LearningHubRecommendationsPart
								loading={hubLoading}
								items={data?.recommendations}
							/>
						</Col>
					</Row>
				</>
			)}
		</div>
	);
}
