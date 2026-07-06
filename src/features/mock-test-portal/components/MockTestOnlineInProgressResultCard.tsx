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

/** Bài thi online đang làm dở — hiển thị trên trang kết quả lead. */
export function MockTestOnlineInProgressResultCard({ attemptStatus }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const active = attemptStatus.activeInExam;
	if (!active?.resumeAllowed) return null;

	const deadline = active.examUnlockExpiresAt
		? new Date(active.examUnlockExpiresAt).toLocaleString('vi-VN', {
				hour: '2-digit',
				minute: '2-digit',
				day: '2-digit',
				month: '2-digit',
			})
		: null;

	return (
		<Card size="small" className="border-amber-300 bg-amber-50/50 shadow-sm">
			<Text strong>Đang làm bài thi thử online</Text>
			<p className="mb-0 mt-1 text-sm text-gray-600">
				Bạn có một bài thi chưa nộp.
				{deadline ? ` Hạn làm bài: ${deadline}.` : null}
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
				Tiếp tục làm bài
			</Button>
		</Card>
	);
}
