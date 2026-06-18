'use client';

import { Card } from 'antd';
import { LearningHubClassPickerPart } from '@/features/learning/components/parts/LearningHubClassPickerPart';
import type { LearningHubClass, LearningHubPayload } from '@/types/learning';

type Props = {
	hub: LearningHubPayload | null;
	hubLoading?: boolean;
	selectedClassId: number | null;
	onClassChange: (classId: number) => void;
	selectedClass: LearningHubClass | null;
	label: string;
};

/** Card chọn lớp trên dashboard con — skeleton nội bộ khi hub đang tải. */
export function LearningDashboardClassContextCard({
	hub,
	hubLoading = false,
	selectedClassId,
	onClassChange,
	selectedClass,
	label,
}: Props) {
	return (
		<Card className="learning-dashboard-context" size="small">
			<LearningHubClassPickerPart
				hub={hub}
				loading={hubLoading}
				selectedClassId={selectedClassId}
				onClassChange={onClassChange}
				selectedClass={selectedClass}
				label={label}
			/>
		</Card>
	);
}
