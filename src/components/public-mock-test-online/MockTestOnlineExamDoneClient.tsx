'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Result, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestOnlinePortalAccessGuide } from '@/components/public-mock-test-online/MockTestOnlinePortalAccessGuide';
import { MockTestOnlineEmailVerificationPrompt } from '@/components/public-mock-test-online/MockTestOnlineEmailVerificationPrompt';
import { MockTestOnlineAttemptLimitAlert } from '@/components/public-mock-test-online/MockTestOnlineAttemptLimitAlert';
import { useProbeLeadSession } from '@/features/mock-test-portal/hooks/useProbeLeadSession';
import { useLeadMockTestInExamStatus } from '@/features/mock-test-portal/hooks/useLeadMockTestInExamStatus';
import {
	resolveMockTestResultsPath,
	PORTAL_MOCK_TEST_RESULTS_ROUTES,
} from '@/lib/portal-auth/session-routes';
import { fetchExamFunnelHint } from '@/lib/complete-profile/check-login-key';
import { loadMockTestOnlineExamAuth } from '@/lib/public-mock-test-online/exam-session';
import { isMockTestOnlineAttemptBlocked } from '@/lib/public-mock-test-online/mock-test-online-attempt-limit.util';

const { Paragraph, Text } = Typography;

const AUTO_REDIRECT_SECONDS_LOGGED_IN = 4;
const AUTO_REDIRECT_SECONDS_GUEST = 6;

export function MockTestOnlineExamDoneClient() {
	const router = useRouter();
	const probe = useProbeLeadSession();
	const sessionKind = probe?.kind ?? null;
	const [hideLeadRegister, setHideLeadRegister] = useState(false);
	const [registrationId, setRegistrationId] = useState<number | null>(null);
	const [countdown, setCountdown] = useState<number | null>(null);
	const redirectedRef = useRef(false);

	const { status: attemptStatus } = useLeadMockTestInExamStatus(
		sessionKind === 'lead' || sessionKind === 'student',
	);

	useEffect(() => {
		const auth = loadMockTestOnlineExamAuth({ allowExpiredToken: true });
		const regId = auth?.registrationId;
		if (regId) setRegistrationId(regId);
		if (!regId) return;
		void fetchExamFunnelHint(regId).then((hint) => {
			setHideLeadRegister(hint.hideLeadRegister);
		});
	}, []);

	const resultsHref = resolveMockTestResultsPath(probe ?? { kind: 'none' });
	const coursesRecommendationsHref = '/lead/courses#recommendations';
	const loginHref = useMemo(() => {
		const returnUrl = encodeURIComponent(resultsHref);
		return `${PORTAL_MOCK_TEST_RESULTS_ROUTES.login}?returnUrl=${returnUrl}`;
	}, [resultsHref]);

	const redirectTarget =
		sessionKind === 'lead' || sessionKind === 'student' ? resultsHref : loginHref;
	const redirectSeconds =
		sessionKind === 'lead' || sessionKind === 'student'
			? AUTO_REDIRECT_SECONDS_LOGGED_IN
			: AUTO_REDIRECT_SECONDS_GUEST;

	const resultsLabel =
		sessionKind === 'student' || sessionKind === 'lead'
			? 'Xem kết quả trên cổng HV'
			: 'Đăng nhập xem kết quả';

	const showLeadRegisterCta = sessionKind === 'none' && !hideLeadRegister;
	const showCoursesCta = sessionKind === 'lead' || sessionKind === 'student';
	const attemptLimitReached = isMockTestOnlineAttemptBlocked(attemptStatus);

	useEffect(() => {
		if (probe === null) return;
		setCountdown(redirectSeconds);
	}, [probe, redirectSeconds]);

	useEffect(() => {
		if (countdown === null || countdown <= 0 || redirectedRef.current) return;
		if (countdown === 1) {
			redirectedRef.current = true;
			router.replace(redirectTarget);
			return;
		}
		const timer = window.setTimeout(() => {
			setCountdown((c) => (c != null && c > 0 ? c - 1 : c));
		}, 1000);
		return () => window.clearTimeout(timer);
	}, [countdown, redirectTarget, router]);

	return (
		<MockTestOnlineFunnelShell step="exam">
			<Result
				icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
				title="Đã nộp bài thành công"
				subTitle={
					<>
						Cảm ơn bạn đã hoàn thành bài thi thử. Kết quả sẽ được gửi qua Zalo OA
						Ebest; nếu bạn chọn nhận qua email, hãy xác nhận email để nhận điểm sau
						khi chấm xong.
						{countdown != null && countdown > 0 ? (
							<Text className="block !mt-2 text-sm" type="secondary">
								Tự chuyển tới{' '}
								{sessionKind === 'lead' || sessionKind === 'student'
									? 'trang kết quả'
									: 'trang đăng nhập'}{' '}
								sau {countdown} giây…
							</Text>
						) : null}
					</>
				}
				extra={[
					<Link key="results" href={sessionKind === 'none' ? loginHref : resultsHref}>
						<Button type="primary" size="large" loading={probe === null}>
							{resultsLabel}
						</Button>
					</Link>,
					showCoursesCta ? (
						<Link key="courses" href={coursesRecommendationsHref}>
							<Button size="large">Xem khóa gợi ý</Button>
						</Link>
					) : null,
					showLeadRegisterCta ? (
						<Link key="register" href="/mock-test-online/register">
							<Button size="large">Đăng ký thi thử khác</Button>
						</Link>
					) : null,
				].filter(Boolean)}
			/>
			{showLeadRegisterCta && attemptLimitReached ? (
				<>
					<MockTestOnlineAttemptLimitAlert
						attemptStatus={attemptStatus}
						variant="warning"
						className="!mt-4"
					/>
					<Paragraph type="secondary" className="text-center text-sm !mb-0 !mt-2">
						Bạn vẫn có thể xem thông tin đăng ký — sắp có thêm gói thi thử trả phí.
						Liên hệ Ebest nếu cần tư vấn thêm.
					</Paragraph>
				</>
			) : null}
			<MockTestOnlineEmailVerificationPrompt registrationId={registrationId} />
			<MockTestOnlinePortalAccessGuide probe={probe} />
			{showLeadRegisterCta ? (
				<Paragraph type="secondary" className="text-center text-sm !mb-0 !mt-4">
					Chưa có tài khoản?{' '}
					<Link href="/lead/register">Đăng ký tài khoản lead</Link> để theo dõi kết
					quả sau này.
				</Paragraph>
			) : null}
			{sessionKind === 'none' && hideLeadRegister ? (
				<Paragraph type="secondary" className="text-center text-sm !mb-0 !mt-4">
					Email/SĐT đăng ký đã có trên cổng học viên.{' '}
					<Link href={loginHref}>Đăng nhập</Link> để theo dõi kết quả và đánh giá bài
					thi.
				</Paragraph>
			) : null}
		</MockTestOnlineFunnelShell>
	);
}
