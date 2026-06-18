'use client';

import { useMemo } from 'react';
import { Select, Skeleton, Typography } from 'antd';
import {
	LearningAccessNotice,
	LearningAccessNoticeInline,
} from '@/features/learning/components/LearningAccessNotice';
import { resolveReadOnlyNoticeMessage } from '@/features/learning/utils/learning-access';
import type { LearningHubClass, LearningHubPayload } from '@/types/learning';

const { Text, Paragraph } = Typography;

type Props = {
	hub: LearningHubPayload | null;
	loading?: boolean;
	selectedClassId: number | null;
	onClassChange: (classId: number) => void;
	selectedClass: LearningHubClass | null;
	/** Nhãn block chọn lớp */
	label?: string;
	wrapInCard?: boolean;
};

export function LearningHubClassPickerPart({
	hub,
	loading = false,
	selectedClassId,
	onClassChange,
	selectedClass,
	label = 'Lớp học',
	wrapInCard = false,
}: Props) {
	const classOptions = useMemo(
		() =>
			(hub?.classes ?? []).map((c) => ({
				value: c.classId,
				label:
					c.interactionMode === 'read_only'
						? `${c.className} (Chỉ xem)`
						: c.className,
			})),
		[hub?.classes],
	);

	const classAccessNotice = resolveReadOnlyNoticeMessage(selectedClass?.readOnlyReason);

	const body = loading ? (
		<Skeleton active paragraph={{ rows: 1 }} title={false} />
	) : classOptions.length > 1 ? (
		<div className="learning-hub-class-picker__row">
			<Select
				className="w-full"
				size="large"
				value={selectedClassId ?? undefined}
				options={classOptions}
				onChange={onClassChange}
				placeholder="Chọn lớp"
			/>
			{classAccessNotice ? <LearningAccessNotice message={classAccessNotice} /> : null}
		</div>
	) : selectedClass ? (
		<Paragraph type="secondary" className="!mb-0">
			<LearningAccessNoticeInline message={classAccessNotice}>
				<span>
					Lớp: <Text strong>{selectedClass.className}</Text>
				</span>
			</LearningAccessNoticeInline>
		</Paragraph>
	) : (
		<Text type="secondary">Chưa có lớp phù hợp.</Text>
	);

	const content = (
		<>
			<Text type="secondary" className="mb-1 block text-sm">
				{label}
			</Text>
			{body}
		</>
	);

	if (wrapInCard) {
		return <div className="learning-dashboard-context">{content}</div>;
	}

	return <div className="learning-hub-class-picker">{content}</div>;
}
