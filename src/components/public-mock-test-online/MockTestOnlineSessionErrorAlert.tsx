'use client';

import { useRouter } from 'next/navigation';
import { Alert, Button, Space } from 'antd';
import { clearMockTestOnlineSelectExamCache } from '@/lib/public-mock-test-online/exam-flow.util';
import {
	getMockTestOnlineRecoveryHref,
	type MockTestOnlineFunnelStep,
} from '@/lib/public-mock-test-online/mock-test-online-flow-dependencies';
import {
	isMockTestOnlineControlledAttemptGateError,
	resolveMockTestOnlineErrorCopy,
	type MockTestOnlineErrorRecovery,
} from '@/lib/public-mock-test-online/mock-test-online-session-errors.util';
import { ContactSupportRichText } from '@/components/portal-contact/ContactSupportRichText';
import { useFanpageContactUrl } from '@/contexts/portal-contact-links-context';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { MockTestErrorDiagnosticsBox } from '@/components/public-mock-test-online/MockTestErrorDiagnosticsBox';
import type { MockTestErrorDiagnostics } from '@/lib/public-mock-test-online/mock-test-error-details';

type Props = {
	message: string;
	step: MockTestOnlineFunnelStep;
	errorCode?: string;
	recovery?: MockTestOnlineErrorRecovery;
	onRetry?: () => void;
	diagnostics?: MockTestErrorDiagnostics;
	/** Quay lại form chọn đề (hết lượt session — chọn chiến dịch khác). */
	onDismiss?: () => void;
};

export function MockTestOnlineSessionErrorAlert({
	message,
	step,
	errorCode,
	recovery: recoveryOverride,
	onRetry,
	diagnostics,
	onDismiss,
}: Props) {
	const router = useRouter();
	const fanpageUrl = useFanpageContactUrl();
	const copy = resolveMockTestOnlineErrorCopy({ message, step, errorCode });
	const recovery = recoveryOverride ?? copy.recovery ?? 'restart';
	const isControlledGate = isMockTestOnlineControlledAttemptGateError(
		errorCode,
		message,
	);

	const handleRestart = () => {
		clearMockTestOnlineSelectExamCache();
		router.push(getMockTestOnlineRecoveryHref());
	};

	const mentionsSupport = /Fanpage|liên hệ Ebest/i.test(
		`${copy.title} ${copy.description}`,
	);

	const mergedDiagnostics: MockTestErrorDiagnostics = {
		code: diagnostics?.code ?? errorCode,
		rawMessage: diagnostics?.rawMessage ?? message,
		path: diagnostics?.path ?? step,
		httpStatus: diagnostics?.httpStatus,
		occurredAt: diagnostics?.occurredAt ?? new Date().toISOString(),
		stack: diagnostics?.stack,
		extra: diagnostics?.extra,
		errorName: diagnostics?.errorName,
	};

	return (
		<Alert
			type={isControlledGate ? 'warning' : 'error'}
			showIcon
			message={<ContactSupportRichText text={copy.title} />}
			description={
				<Space direction="vertical" size="middle" className="w-full">
					<ContactSupportRichText text={copy.description} />
					{!isControlledGate ? (
						<MockTestErrorDiagnosticsBox diagnostics={mergedDiagnostics} />
					) : null}
					<Space wrap>
						{recovery === 'restart' ? (
							<Button type="primary" onClick={handleRestart}>
								Bắt đầu lại
							</Button>
						) : null}
						{recovery === 'lead_tests' ? (
							<>
								<Button
									type="primary"
									onClick={() =>
										router.push(PORTAL_MOCK_TEST_ROUTES.results)
									}
								>
									Xem lịch sử thi
								</Button>
								{onDismiss ? (
									<Button onClick={onDismiss}>Chọn chiến dịch khác</Button>
								) : (
									<Button onClick={handleRestart}>Chọn bài thi khác</Button>
								)}
							</>
						) : null}
						{recovery === 'login' ? (
							<Button type="primary" href="/login">
								Đăng nhập
							</Button>
						) : null}
						{recovery === 'retry' && onRetry ? (
							<Button type="primary" onClick={onRetry}>
								Thử lại
							</Button>
						) : null}
						{recovery === 'retry' && !onRetry ? (
							<Button type="primary" onClick={() => window.location.reload()}>
								Tải lại trang
							</Button>
						) : null}
						{mentionsSupport ||
						recovery === 'contact_support' ||
						recovery === 'login' ? (
							<Button
								href={fanpageUrl}
								target="_blank"
								rel="noopener noreferrer"
							>
								Nhắn tin Fanpage Ebest
							</Button>
						) : null}
					</Space>
				</Space>
			}
		/>
	);
}
