'use client';

import { useRouter } from 'next/navigation';
import { Alert, Button, Space } from 'antd';
import { clearMockTestOnlineSelectExamCache } from '@/lib/public-mock-test-online/exam-flow.util';
import {
	getMockTestOnlineRecoveryHref,
	type MockTestOnlineFunnelStep,
} from '@/lib/public-mock-test-online/mock-test-online-flow-dependencies';
import {
	resolveMockTestOnlineErrorCopy,
	type MockTestOnlineErrorRecovery,
} from '@/lib/public-mock-test-online/mock-test-online-session-errors.util';
import { ContactSupportRichText } from '@/components/portal-contact/ContactSupportRichText';
import { useFanpageContactUrl } from '@/contexts/portal-contact-links-context';

type Props = {
	message: string;
	step: MockTestOnlineFunnelStep;
	errorCode?: string;
	/** Ghi đè recovery nếu caller biết ngữ cảnh (vd. deny authorize → lead_tests). */
	recovery?: MockTestOnlineErrorRecovery;
	onRetry?: () => void;
};

export function MockTestOnlineSessionErrorAlert({
	message,
	step,
	errorCode,
	recovery: recoveryOverride,
	onRetry,
}: Props) {
	const router = useRouter();
	const fanpageUrl = useFanpageContactUrl();
	const copy = resolveMockTestOnlineErrorCopy({ message, step, errorCode });
	const recovery = recoveryOverride ?? copy.recovery ?? 'restart';

	const handleRestart = () => {
		clearMockTestOnlineSelectExamCache();
		router.push(getMockTestOnlineRecoveryHref());
	};

	const mentionsSupport = /Fanpage|liên hệ Ebest/i.test(
		`${copy.title} ${copy.description}`,
	);

	return (
		<Alert
			type="error"
			showIcon
			message={<ContactSupportRichText text={copy.title} />}
			description={
				<Space direction="vertical" size="middle" className="w-full">
					<ContactSupportRichText text={copy.description} />
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
									onClick={() => router.push('/lead/tests')}
								>
									Xem lịch sử thi
								</Button>
								<Button onClick={handleRestart}>Đăng ký lại</Button>
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
