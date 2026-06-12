'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Alert, Button, Card, Empty, Select, Skeleton, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/layout';
import {
	LearningAccessNotice,
	LearningAccessNoticeInline,
} from '@/features/learning/components/LearningAccessNotice';
import { useLearningHub } from '@/features/learning/hooks/useLearningHub';
import { LearningClassVocabularySessions } from '@/features/learning/components/LearningClassVocabularySessions';
import { resolveReadOnlyNoticeMessage } from '@/features/learning/utils/learning-access';

const { Text, Paragraph } = Typography;

/** Hub điều hướng Lớp → Buổi → chi tiết từ vựng. */
export function VocabularyPracticeHomeView() {
	const searchParams = useSearchParams();
	const classIdFromUrl = Number(searchParams.get('classId'));

	const {
		data,
		loading,
		error,
		refresh,
		selectedClassId,
		setSelectedClassId,
		selectedClass,
	} = useLearningHub();

	useEffect(() => {
		if (!Number.isFinite(classIdFromUrl) || classIdFromUrl < 1) return;
		if (data?.classes?.some((c) => c.classId === classIdFromUrl)) {
			setSelectedClassId(classIdFromUrl);
		}
	}, [classIdFromUrl, data?.classes, setSelectedClassId]);

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

	if (loading) {
		return (
			<div>
				<PageHeader title="Luyện từ vựng" />
				<Skeleton active paragraph={{ rows: 6 }} />
			</div>
		);
	}

	if (error) {
		return (
			<div>
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
			<div>
				<PageHeader title="Luyện từ vựng" />
				<Empty description="Bạn chưa có lớp học nào." />
			</div>
		);
	}

	const classAccessNotice = resolveReadOnlyNoticeMessage(selectedClass?.readOnlyReason);

	return (
		<div>
			<PageHeader
				title="Luyện từ vựng"
				description="Chọn lớp và buổi học để xem từ, luyện flashcard hoặc chơi game."
				extra={
					<Button icon={<ReloadOutlined />} onClick={refresh}>
						Làm mới
					</Button>
				}
			/>

			{classOptions.length > 1 ? (
				<div className="mb-4 max-w-md">
					<Text className="mb-1 block text-sm text-[#434343]">Lớp học</Text>
					<div className="learning-hub-class-picker__row">
						<Select
							className="w-full"
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
				<Paragraph className="!mb-4 text-[#434343]">
					<LearningAccessNoticeInline message={classAccessNotice}>
						<span>
							Lớp: <Text strong>{selectedClass.className}</Text>
						</span>
					</LearningAccessNoticeInline>
				</Paragraph>
			) : null}

			{selectedClassId ? (
				<Card title="Buổi học có từ vựng" styles={{ body: { paddingTop: 12 } }}>
					<Text type="secondary" className="mb-3 block text-sm">
						Chạm vào buổi để xem danh sách từ và luyện flashcard.
					</Text>
					<LearningClassVocabularySessions classId={selectedClassId} mode="navigate" />
				</Card>
			) : (
				<Empty description="Chọn lớp để xem danh sách buổi." />
			)}

			<Paragraph className="mt-4 text-sm text-[#434343]">
				Game Survival và bảng xếp hạng theo cả lớp:{' '}
				<Link href="/learning" className="text-[#1677ff]">
					mục Học tập
				</Link>
				.
			</Paragraph>
		</div>
	);
}
