'use client';

import { LearningClassVocabularySessions } from '@/features/learning/components/LearningClassVocabularySessions';
import type { OverviewClassSessions } from '@/types/overview-sessions';
import { Empty, Flex, Spin } from 'antd';

type Props = {
	loading: boolean;
	overview: OverviewClassSessions | null;
};

/** Tab Từ vựng trên trang chi tiết lớp — danh sách buổi, không chen vào lịch học. */
export function ClassVocabularyTab({ loading, overview }: Props) {
	if (loading) {
		return (
			<Flex justify="center" align="center" style={{ padding: '48px 0' }}>
				<Spin tip="Đang tải..." />
			</Flex>
		);
	}

	if (!overview) {
		return (
			<Empty
				image={Empty.PRESENTED_IMAGE_SIMPLE}
				description="Không tìm thấy lớp hoặc bạn chưa được gán lớp này."
			/>
		);
	}

	return (
		<LearningClassVocabularySessions
			classId={overview.classId}
			mode="navigate"
		/>
	);
}
