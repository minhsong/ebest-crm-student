'use client';

import Link from 'next/link';
import { Alert, Card, Skeleton } from 'antd';
import { QuizAttemptClient } from '@/features/quiz-test/components/QuizAttemptClient';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { useMockTestOnlineExamGate } from '@/components/public-mock-test-online/useMockTestOnlineExamGate';

type MockTestOnlineQuizEntry = 'lobby' | 'session';

type Props = {
	entry: MockTestOnlineQuizEntry;
};

export function MockTestOnlineExamQuizClient({ entry }: Props) {
	const { auth, loading } = useMockTestOnlineExamGate();

	if (loading || !auth) {
		return (
			<MockTestOnlineFunnelShell step="exam">
				<Card bordered={false}>
					<Skeleton active paragraph={{ rows: 6 }} />
				</Card>
			</MockTestOnlineFunnelShell>
		);
	}

	const formPublicId = auth.formPublicId;
	if (!formPublicId) {
		return (
			<MockTestOnlineFunnelShell step="exam">
				<Alert
					type="error"
					showIcon
					message="Không mở được bài thi"
					description="Phiên làm bài không hợp lệ hoặc đã hết hạn."
					action={
						<Link href="/mock-test-online/register">Đăng ký lại</Link>
					}
				/>
			</MockTestOnlineFunnelShell>
		);
	}

	return (
		<MockTestOnlineFunnelShell
			step="exam"
			showProgress={entry === 'lobby'}
			wide={entry === 'session'}
		>
			<div
				className={
					entry === 'lobby'
						? 'mock-test-online-exam-ready'
						: 'mock-test-online-exam-run'
				}
			>
				<QuizAttemptClient
					formPublicId={formPublicId}
					effectiveMaxAttempts={1}
					mockTestOnlineEntry={entry}
					mockTestOnlineRuntime
				/>
			</div>
		</MockTestOnlineFunnelShell>
	);
}
