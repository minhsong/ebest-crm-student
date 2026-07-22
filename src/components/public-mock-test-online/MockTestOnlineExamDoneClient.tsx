'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Result, Typography } from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestOnlinePortalAccessGuide } from '@/components/public-mock-test-online/MockTestOnlinePortalAccessGuide';
import { MockTestOnlineEmailVerificationPrompt } from '@/components/public-mock-test-online/MockTestOnlineEmailVerificationPrompt';
import { MockTestOnlineAttemptLimitAlert } from '@/components/public-mock-test-online/MockTestOnlineAttemptLimitAlert';
import { MockTestOnlineSessionErrorAlert } from '@/components/public-mock-test-online/MockTestOnlineSessionErrorAlert';
import { usePortalMockTestInExamStatus } from '@/features/mock-test-portal/hooks/useLeadMockTestInExamStatus';
import { fetchExamFunnelHint } from '@/lib/complete-profile/check-login-key';
import {
	clearMockTestOnlineExamAuth,
	loadMockTestOnlineExamAuth,
} from '@/lib/public-mock-test-online/exam-session';
import { readMockTestOnlineExpectedScore } from '@/lib/public-mock-test-online/exam-expected-score.util';
import { isMockTestOnlineAttemptBlocked } from '@/lib/public-mock-test-online/mock-test-online-attempt-limit.util';
import {
	fetchMockTestPostExamDestination,
	type MockTestPostExamDestination,
} from '@/lib/public-mock-test-online/mock-test-online-api.client';
import { isLeadCompleteProfileHref } from '@/lib/portal-auth/session-routes';

const { Paragraph, Text } = Typography;

const AUTO_REDIRECT_SECONDS_LOGGED_IN = 4;
const AUTO_REDIRECT_SECONDS_GUEST = 6;

export function MockTestOnlineExamDoneClient() {
	const router = useRouter();
	const [destination, setDestination] =
		useState<MockTestPostExamDestination | null>(null);
	const [destinationError, setDestinationError] = useState(false);
	const sessionKind =
		destination?.actor === 'guest' ? 'none' : destination?.actor ?? null;
	const loggedIn =
		destination?.actor === 'lead' || destination?.actor === 'customer';
	const [hideLeadRegister, setHideLeadRegister] = useState(false);
	const [registrationId, setRegistrationId] = useState<number | null>(null);
	const [expectedScore, setExpectedScore] = useState<number | null>(null);
	const [countdown, setCountdown] = useState<number | null>(null);
	const redirectedRef = useRef(false);

	const { status: attemptStatus } = usePortalMockTestInExamStatus(loggedIn);

	useEffect(() => {
		void fetchMockTestPostExamDestination()
			.then((dest) => {
				setDestinationError(false);
				setDestination(dest);
			})
			.catch(() => {
				setDestinationError(true);
				setDestination({
					actor: 'guest',
					nextPath: '/login?returnUrl=%2Fmock-test%2Fresults',
				});
			});
	}, []);

	useEffect(() => {
		const auth = loadMockTestOnlineExamAuth({ allowExpiredToken: true });
		const regId = auth?.registrationId;
		if (regId) {
			setRegistrationId(regId);
			setExpectedScore(readMockTestOnlineExpectedScore(regId));
		}
		// Metadata trước; cookie T3 clear qua BFF (httpOnly).
		clearMockTestOnlineExamAuth();
		void fetch('/api/public/mock-test-online/clear-exam-auth', {
			method: 'POST',
			credentials: 'same-origin',
		}).catch(() => {
			/* best-effort — TTL cookie vẫn hết hạn */
		});
		if (!regId) return;
		void fetchExamFunnelHint(regId)
			.then((hint) => {
				setHideLeadRegister(hint.hideLeadRegister);
			})
			.catch(() => {
				/* không chặn màn done */
			});
	}, []);

	const coursesRecommendationsHref = '/lead/courses#recommendations';
	const redirectTarget = destination?.nextPath ?? null;
	const redirectSeconds = loggedIn
		? AUTO_REDIRECT_SECONDS_LOGGED_IN
		: AUTO_REDIRECT_SECONDS_GUEST;

	const needsCompleteProfile = isLeadCompleteProfileHref(
		destination?.nextPath,
	);
	const resultsLabel = needsCompleteProfile
		? 'Hoàn thiện tài khoản'
		: loggedIn
			? 'Tiếp tục đến cổng Ebest'
			: 'Đăng nhập xem kết quả';

	const showLeadRegisterCta = sessionKind === 'none' && !hideLeadRegister;
	/** Courses / dashboard chỉ sau khi Lead đã hoàn thiện hồ sơ (PO-D19). */
	const showCoursesCta = loggedIn && !needsCompleteProfile;
	const attemptLimitReached = isMockTestOnlineAttemptBlocked(attemptStatus);

	useEffect(() => {
		if (destination === null) return;
		setCountdown(redirectSeconds);
	}, [destination, redirectSeconds]);

	useEffect(() => {
		if (countdown === null || countdown <= 0 || redirectedRef.current) return;
		if (countdown === 1 && redirectTarget) {
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
			{destinationError ? (
				<div className="mb-4">
					<MockTestOnlineSessionErrorAlert
						message="Không xác định được bước tiếp theo sau khi nộp bài."
						step="b3_exam"
						errorCode="POST_EXAM_DESTINATION_FAILED"
						recovery="login"
					/>
				</div>
			) : null}
			<Result
				icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
				title="Đã nộp bài thành công"
				subTitle={
					<>
						Cảm ơn bạn đã hoàn thành bài thi thử. Kết quả sẽ được gửi qua Zalo OA
						Ebest; nếu bạn chọn nhận qua email, hãy xác nhận email để nhận điểm sau
						khi chấm xong.
						{expectedScore != null ? (
							<Text className="block !mt-2 text-sm" type="secondary">
								Điểm kỳ vọng lần này: <strong>{expectedScore}</strong> — đối chiếu
								với điểm thực tế trên trang kết quả khi bài đã chấm xong.
							</Text>
						) : null}
						{countdown != null && countdown > 0 ? (
							<Text className="block !mt-2 text-sm" type="secondary">
								Tự chuyển tới{' '}
								{needsCompleteProfile
									? 'bước hoàn thiện tài khoản'
									: loggedIn
										? 'cổng Ebest'
										: 'trang đăng nhập'}{' '}
								sau {countdown} giây…
							</Text>
						) : null}
					</>
				}
				extra={[
					<Link key="results" href={redirectTarget ?? '/login'}>
						<Button type="primary" size="large" loading={destination === null}>
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
			<MockTestOnlinePortalAccessGuide
				probe={sessionKind == null ? null : { kind: sessionKind }}
				nextPath={destination?.nextPath}
			/>
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
					<Link href={redirectTarget ?? '/login'}>Đăng nhập</Link> để theo dõi kết quả và đánh giá bài
					thi.
				</Paragraph>
			) : null}
		</MockTestOnlineFunnelShell>
	);
}
