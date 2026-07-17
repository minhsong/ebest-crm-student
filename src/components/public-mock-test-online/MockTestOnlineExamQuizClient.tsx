'use client';

import Link from 'next/link';
import { Alert, Button, Card, Skeleton, Space } from 'antd';
import { QuizAttemptClient } from '@/features/quiz-test/components/QuizAttemptClient';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { useMockTestOnlineExamGate } from '@/components/public-mock-test-online/useMockTestOnlineExamGate';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

type MockTestOnlineQuizEntry = 'lobby' | 'session';

type Props = {
	entry: MockTestOnlineQuizEntry;
};

export function MockTestOnlineExamQuizClient({ entry }: Props) {
	const { auth, loading, gateFailure } = useMockTestOnlineExamGate();

	if (loading) {
		return (
			<MockTestOnlineFunnelShell step="exam">
				<Card bordered={false}>
					<Skeleton active paragraph={{ rows: 6 }} />
				</Card>
			</MockTestOnlineFunnelShell>
		);
	}

	if (gateFailure || !auth) {
		const failure = gateFailure ?? {
			title: 'Không mở được bài thi',
			description: 'Phiên làm bài không hợp lệ hoặc đã hết hạn.',
		};
		return (
			<MockTestOnlineFunnelShell step="exam">
				<Alert
					type="warning"
					showIcon
					message={failure.title}
					description={
						<Space direction="vertical" size="middle" className="w-full">
							<span>{failure.description}</span>
							<Space wrap>
								<Link href="/mock-test-online/register">
									<Button type="primary">Về trang đăng ký</Button>
								</Link>
								<Link href={PORTAL_MOCK_TEST_ROUTES.results}>
									<Button>Xem lịch sử thi</Button>
								</Link>
							</Space>
						</Space>
					}
				/>
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
					description={
						<Space direction="vertical" size="middle" className="w-full">
							<span>Thiếu thông tin đề thi. Vui lòng chọn lại bài thi.</span>
							<Link href="/mock-test-online/register">
								<Button type="primary">Đăng ký lại</Button>
							</Link>
						</Space>
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
					effectiveMaxAttempts={
						typeof auth.effectiveMaxAttempts === 'number' &&
						auth.effectiveMaxAttempts >= 1
							? auth.effectiveMaxAttempts
							: 1
					}
					mockTestOnlineEntry={entry}
					mockTestOnlineRuntime
				/>
			</div>
		</MockTestOnlineFunnelShell>
	);
}
