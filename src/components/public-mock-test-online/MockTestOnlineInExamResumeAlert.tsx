'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Button } from 'antd';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import { navigateMockTestOnlineResume } from '@/lib/public-mock-test-online/mock-test-online-resume-navigation.client';

type Props = {
	attemptStatus: MockTestOnlineAttemptStatus | null;
	className?: string;
};

/** CTA resume khi `in_exam` còn giờ (BL-Q2 / LP-EXAM-03). */
export function MockTestOnlineInExamResumeAlert({
	attemptStatus,
	className,
}: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const active = attemptStatus?.activeInExam;
	if (!active?.resumeAllowed || !attemptStatus) return null;

	const deadline = active.examUnlockExpiresAt
		? new Date(active.examUnlockExpiresAt).toLocaleString('vi-VN', {
				hour: '2-digit',
				minute: '2-digit',
				day: '2-digit',
				month: '2-digit',
			})
		: null;

	return (
		<Alert
			type="warning"
			showIcon
			className={className ?? '!mb-4'}
			message="Bạn đang có bài thi làm dở"
			description={
				deadline
					? `Hãy tiếp tục làm bài trước khi đăng ký lượt mới. Bạn cần vào phòng thi trước ${deadline}.`
					: 'Hãy tiếp tục làm bài trước khi đăng ký lượt mới.'
			}
			action={
				<Button
					type="primary"
					size="small"
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
			}
		/>
	);
}
