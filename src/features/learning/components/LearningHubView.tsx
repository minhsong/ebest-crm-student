'use client';

import { useMemo } from 'react';
import Link from 'next/link';
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
	ReloadOutlined,
	ThunderboltOutlined,
	TrophyOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import { LearningRecommendationCards } from '@/features/learning/components/LearningRecommendationCards';
import { formatAssignmentDeadline } from '@/lib/learning-assignments-due';

const { Text, Paragraph } = Typography;

export function LearningHubView() {
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

	const today = data?.todaySession;
	const stats = data?.weekStats;

	const flashcardHref =
		today && selectedClassId
			? `/learning/flashcard?classId=${today.classId}&classSessionId=${today.classSessionId}`
			: null;

	const wordsHref =
		today && selectedClassId
			? `/learning/vocabulary/sessions/${today.classSessionId}?classId=${today.classId}`
			: null;

	if (loading) {
		return (
			<div>
				<PageHeader title="Học tập" />
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	if (error) {
		return (
			<div>
				<PageHeader title="Học tập" extra={<Button icon={<ReloadOutlined />} onClick={refresh}>Thử lại</Button>} />
				<Alert type="error" showIcon message={error} description="Nếu tính năng chưa bật, vui lòng liên hệ trung tâm." />
			</div>
		);
	}

	if (
		data?.context?.messageCode === 'NO_ENROLLMENT' ||
		data?.context?.messageCode === 'NO_ACTIVE_ENROLLMENT'
	) {
		return (
			<div>
				<PageHeader title="Học tập" />
				<Empty description="Bạn chưa có lớp học nào. Khi được ghi danh, nội dung luyện tập sẽ hiển thị tại đây." />
			</div>
		);
	}

	const selectedInteractive = selectedClass?.interactionMode === 'interactive';
	const canOpenPractice = Boolean(selectedClassId && selectedClass);

	const practiceHref =
		selectedClassId != null
			? `/learning/practice?classId=${selectedClassId}`
			: null;

	const leaderboardHref =
		selectedClassId != null
			? `/learning/leaderboard?classId=${selectedClassId}`
			: null;

	return (
		<div>
			<PageHeader
				title="Học tập"
				description="Tiến độ tuần, gợi ý luyện tập, game Survival và bảng xếp hạng."
				extra={
					<Button icon={<ReloadOutlined />} onClick={refresh}>
						Làm mới
					</Button>
				}
			/>

			{classOptions.length > 1 ? (
				<div className="mb-4 max-w-md">
					<Text type="secondary" className="mb-1 block text-sm">
						Lớp học
					</Text>
					<Select
						className="w-full"
						value={selectedClassId ?? undefined}
						options={classOptions}
						onChange={setSelectedClassId}
						placeholder="Chọn lớp"
					/>
				</div>
			) : selectedClass ? (
				<Paragraph type="secondary" className="!mb-4">
					Lớp: <Text strong>{selectedClass.className}</Text>
				</Paragraph>
			) : null}

			{selectedClass?.interactionMode === 'read_only' && selectedClass.readOnlyReason ? (
				<Alert type="info" showIcon message={selectedClass.readOnlyReason} className="mb-4" />
			) : null}

			{data?.recommendations?.length ? (
				<LearningRecommendationCards items={data.recommendations} />
			) : null}

			<Row gutter={[16, 16]}>
				<Col xs={24} lg={14}>
					<Card
						title={
							<span>
								<ThunderboltOutlined className="mr-2" />
								Từ buổi hôm nay
							</span>
						}
					>
						{today ? (
							<Flex vertical gap="middle">
								<div>
									<Text strong>{today.title}</Text>
									<div className="text-sm text-gray-500">
										{today.className} · {today.assetCount} từ
									</div>
								</div>
								<Flex wrap gap="small">
									{flashcardHref && selectedInteractive ? (
										<Link href={flashcardHref}>
											<Button type="primary" icon={<BookOutlined />}>
												Luyện flashcard
											</Button>
										</Link>
									) : null}
									{wordsHref ? (
										<Link href={wordsHref}>
											<Button icon={<BookOutlined />}>Xem danh sách từ</Button>
										</Link>
									) : null}
									<Link href="/learning/vocabulary">
										<Button type="link" className="!px-0">
											Tất cả buổi →
										</Button>
									</Link>
								</Flex>
							</Flex>
						) : (
							<Empty
								image={Empty.PRESENTED_IMAGE_SIMPLE}
								description="Hôm nay chưa có buổi có từ vựng để luyện, hoặc buổi học chưa diễn ra."
							/>
						)}
					</Card>

					<Card className="mt-4" title="Bài sắp đến hạn">
						{assignmentsDue.length > 0 ? (
							<ul className="m-0 list-none space-y-3 p-0">
								{assignmentsDue.map((item) => (
									<li key={item.assignmentId} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
										<Link href="/assignments" className="font-medium text-inherit hover:text-blue-600">
											{item.title}
										</Link>
										<div className="text-sm text-gray-500">
											{item.className} · {item.sessionTitle}
										</div>
										<div className="text-sm">
											Hạn: <Text strong>{formatAssignmentDeadline(item.deadline)}</Text>
										</div>
									</li>
								))}
							</ul>
						) : (
							<Flex vertical gap="small">
								<Text type="secondary">Xem bài tập và deadline trên trang Bài tập.</Text>
								<Link href="/assignments">
									<Button type="link" className="!px-0">
										Mở Bài tập
									</Button>
								</Link>
							</Flex>
						)}
					</Card>
				</Col>

				<Col xs={24} lg={10}>
					<Card title="Tuần này">
						<Row gutter={16}>
							<Col span={12}>
								<Statistic title="Lần luyện" value={stats?.weekEventCount ?? 0} />
							</Col>
							<Col span={12}>
								<Statistic title="Từ đã xem" value={stats?.weekUniqueAssetsSeen ?? 0} />
							</Col>
							<Col span={12} className="mt-4">
								<Statistic title="Quiz đã làm" value={stats?.weekQuizAttempts ?? 0} />
							</Col>
							<Col span={12} className="mt-4">
								<Statistic title="Điểm drill tuần" value={stats?.weekDrillScore ?? 0} />
							</Col>
						</Row>
					</Card>

					<Card className="mt-4" title="Luyện từ vựng (Survival)">
						<Paragraph type="secondary" className="!mb-3">
							Luyện toàn pool từ đã mở khóa — mỗi câu đúng +1 điểm, lượt dừng khi sai.
						</Paragraph>
						{canOpenPractice && practiceHref ? (
							<Link href={practiceHref}>
								<Button block type="primary" icon={<ThunderboltOutlined />}>
									Mở Luyện từ vựng
								</Button>
							</Link>
						) : (
							<Text type="secondary">Chọn lớp để bắt đầu luyện.</Text>
						)}
					</Card>

					<Card className="mt-4" title="Bảng xếp hạng">
						<Paragraph type="secondary" className="!mb-3">
							Xếp hạng theo tổng điểm Survival — lớp và toàn khóa, tuần / tháng / tất cả.
						</Paragraph>
						{canOpenPractice && leaderboardHref ? (
							<Link href={leaderboardHref}>
								<Button block icon={<TrophyOutlined />}>
									Mở bảng xếp hạng
								</Button>
							</Link>
						) : (
							<Text type="secondary">Chọn lớp để xem bảng xếp hạng.</Text>
						)}
					</Card>

				</Col>
			</Row>
		</div>
	);
}
