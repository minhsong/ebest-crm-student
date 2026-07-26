'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card, Typography } from 'antd';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { navigateMockTestOnlineResume } from '@/lib/public-mock-test-online/mock-test-online-resume-navigation.client';

const { Text } = Typography;

type Props = {
	attemptStatus: MockTestOnlineAttemptStatus;
};

/** Bài thi online đang làm dở / đã mở khóa chưa start — trang kết quả. */
export function MockTestOnlineInProgressResultCard({ attemptStatus }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const inExam = attemptStatus.activeInExam?.resumeAllowed
		? attemptStatus.activeInExam
		: null;
	const ready =
		!inExam && attemptStatus.activeReady?.resumeAllowed
			? attemptStatus.activeReady
			: null;
	if (!inExam && !ready) return null;

	const deadlineRaw = inExam?.examUnlockExpiresAt ?? ready?.examUnlockExpiresAt;
	const deadline = deadlineRaw
		? new Date(deadlineRaw).toLocaleString('vi-VN', {
				hour: '2-digit',
				minute: '2-digit',
				day: '2-digit',
				month: '2-digit',
			})
		: null;

	return (
		<Card size="small" className="border-amber-300 bg-amber-50/50 shadow-sm">
			<Text strong>
				{inExam
					? 'Đang làm bài thi thử online'
					: 'Đã mở khóa bài thi — sẵn sàng bắt đầu'}
			</Text>
			<p className="mb-0 mt-1 text-sm text-gray-600">
				{inExam
					? 'Bạn có một bài thi chưa nộp.'
					: 'Bạn đã xác nhận Zalo nhưng chưa bắt đầu. Đồng hồ làm bài chỉ chạy sau khi bấm Start.'}
				{inExam && deadline ? ` Hạn làm bài: ${deadline}.` : null}
			</p>
			<Button
				type="primary"
				size="small"
				className="mt-3"
				loading={loading}
				onClick={() => {
					setLoading(true);
					void navigateMockTestOnlineResume(attemptStatus, router).finally(() =>
						setLoading(false),
					);
				}}
			>
				{inExam ? 'Tiếp tục làm bài' : 'Vào phòng chờ'}
			</Button>
		</Card>
	);
}
