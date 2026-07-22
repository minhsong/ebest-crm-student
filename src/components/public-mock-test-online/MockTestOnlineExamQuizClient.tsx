'use client';

import Link from 'next/link';
import { Button, Card, Skeleton } from 'antd';
import { QuizAttemptClient } from '@/features/quiz-test/components/QuizAttemptClient';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestOnlineSessionErrorAlert } from '@/components/public-mock-test-online/MockTestOnlineSessionErrorAlert';
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
			kind: 'session_expired' as const,
			title: 'Không mở được bài thi',
			description: 'Phiên làm bài không hợp lệ hoặc đã hết hạn.',
		};
		const errorCode =
			failure.kind === 'session_expired'
				? 'EXAM_SESSION_EXPIRED'
				: failure.kind === 'gate_error'
					? 'EXAM_GATE_ERROR'
					: 'FORM_MISMATCH';
		return (
			<MockTestOnlineFunnelShell step="exam">
				<MockTestOnlineSessionErrorAlert
					message={failure.description}
					step="b3_exam"
					errorCode={errorCode}
					recovery={
						failure.kind === 'session_expired' ? 'lead_tests' : 'restart'
					}
				/>
				<div className="mt-3 flex flex-wrap gap-2">
					<Link href="/mock-test-online/register">
						<Button type="primary">Về trang đăng ký</Button>
					</Link>
					<Link href={PORTAL_MOCK_TEST_ROUTES.results}>
						<Button>Xem lịch sử thi</Button>
					</Link>
				</div>
			</MockTestOnlineFunnelShell>
		);
	}

	const formPublicId = auth.formPublicId;
	if (!formPublicId) {
		return (
			<MockTestOnlineFunnelShell step="exam">
				<MockTestOnlineSessionErrorAlert
					message="Thiếu thông tin đề thi. Vui lòng chọn lại bài thi."
					step="b3_exam"
					errorCode="MISSING_FORM"
					recovery="restart"
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
				<MockTestClientErrorBoundary variant="exam">
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
				</MockTestClientErrorBoundary>
			</div>
		</MockTestOnlineFunnelShell>
	);
}
