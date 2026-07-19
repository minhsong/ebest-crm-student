'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
	Alert,
	App,
	Button,
	Card,
	Form,
	Input,
	Spin,
	Tag,
	Typography,
} from 'antd';
import {
	CheckCircleOutlined,
	ClockCircleOutlined,
	MessageOutlined,
} from '@ant-design/icons';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import type { MockTestOnlineCampaign } from '@/lib/public-mock-test-online/types';
import { ZaloConfirmMessageBlock } from '@/components/public-mock-test-online/ZaloConfirmMessageBlock';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { useMockTestOnlineExamAuthorize } from '@/components/public-mock-test-online/useMockTestOnlineExamAuthorize';
import { useMockTestOnlineSelectExamSession } from '@/components/public-mock-test-online/useMockTestOnlineSelectExamSession';
import { useMockTestOnlineZaloVerifySession } from '@/components/public-mock-test-online/useMockTestOnlineZaloVerifySession';
import {
	mockTestOnlineTypeLabel,
	parseZaloConfirmMessage,
} from '@/lib/public-mock-test-online/exam-flow.util';
import { postMockTestOnlineDevSimulateZalo } from '@/lib/public-mock-test-online/mock-test-online-api.client';
import { MockTestOnlineSessionErrorAlert } from '@/components/public-mock-test-online/MockTestOnlineSessionErrorAlert';
import { mockTestUnlockCodeFormRules } from '@/lib/public-mock-test-online/unlock-code.util';

const { Title, Paragraph, Text } = Typography;
const IS_DEV = process.env.NODE_ENV === 'development';

type Props = {
	campaigns: MockTestOnlineCampaign[];
	campaignsError?: string | null;
};

function formatDeadline(iso: string | undefined): string | null {
	if (!iso?.trim()) return null;
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return null;
	return d.toLocaleString('vi-VN', {
		hour: '2-digit',
		minute: '2-digit',
		day: '2-digit',
		month: '2-digit',
	});
}

export function MockTestOnlineConfirmExamClient({
	campaigns,
	campaignsError = null,
}: Props) {
	const searchParams = useSearchParams();
	const { message } = App.useApp();
	const [form] = Form.useForm<{ examUnlockCode: string }>();

	const leadId = searchParams.get('lead')?.trim() ?? '';
	const sessionId = parseInt(searchParams.get('session') ?? '', 10);
	const pendingRegistrationId = searchParams.get('pending')?.trim() ?? '';
	const variant = searchParams.get('variant')?.trim() as 'full' | 'mini' | undefined;

	const campaign = useMemo(
		() => campaigns.find((c) => c.sessionId === sessionId) ?? null,
		[campaigns, sessionId],
	);

	const {
		examSession,
		loading: sessionLoading,
		error: sessionError,
	} = useMockTestOnlineSelectExamSession({
		pendingLeadId: leadId,
		sessionId,
		pendingRegistrationId: pendingRegistrationId || undefined,
		variant,
		campaignTitle: campaign?.title,
	});

	const {
		autoProceeding,
		submittingUnlock,
		authorizeError,
		clearAuthorizeError,
		proceedWithSessionToken,
		proceedAfterZaloVerified,
		proceedWithUnlockCode,
	} = useMockTestOnlineExamAuthorize();

	const handleUnlockReady = useCallback(
		(registrationId: number) => {
			if (!examSession) return;
			void proceedWithSessionToken(examSession, registrationId);
		},
		[examSession, proceedWithSessionToken],
	);

	const { zaloVerified, error: verifyError, status: verifyStatus, verifyIssue } =
		useMockTestOnlineZaloVerifySession({
			pendingRegistrationId: examSession?.pendingRegistrationId,
			examSessionToken: examSession?.examSessionToken,
			enabled: Boolean(examSession?.pendingRegistrationId),
			onUnlockReady: handleUnlockReady,
		});

	const registrationIdReady =
		verifyStatus?.registrationId && verifyStatus.registrationId >= 1
			? verifyStatus.registrationId
			: null;

	const canProceedAfterZalo = zaloVerified && registrationIdReady != null;
	const needsUnlockCode = zaloVerified && !registrationIdReady;

	const autoProceedAttemptedRef = useRef<string | null>(null);

	useEffect(() => {
		if (!canProceedAfterZalo || !examSession || autoProceeding) return;
		if (registrationIdReady == null) return;
		const attemptKey = `${examSession.pendingRegistrationId}:${registrationIdReady}`;
		if (autoProceedAttemptedRef.current === attemptKey) return;
		autoProceedAttemptedRef.current = attemptKey;
		void proceedWithSessionToken(examSession, registrationIdReady);
	}, [
		autoProceeding,
		canProceedAfterZalo,
		examSession,
		proceedWithSessionToken,
		registrationIdReady,
	]);

	const onContinueAfterZalo = useCallback(() => {
		if (!examSession || !registrationIdReady) return;
		proceedAfterZaloVerified(examSession, registrationIdReady);
	}, [examSession, proceedAfterZaloVerified, registrationIdReady]);

	const zaloMessage =
		examSession?.zaloConfirmMessage ||
		(examSession?.zaloDeepLink
			? parseZaloConfirmMessage(examSession.zaloDeepLink)
			: '');

	const devSimulateZalo = useCallback(async () => {
		if (!examSession?.pendingRegistrationId) return;
		try {
			const data = await postMockTestOnlineDevSimulateZalo(
				examSession.pendingRegistrationId,
			);
			form.setFieldsValue({ examUnlockCode: data.examUnlockCode });
			if (data.registrationId) {
				handleUnlockReady(data.registrationId);
			}
			message.success(`Dev: mã mở khóa — ${data.examUnlockCode}`);
		} catch (e) {
			message.error(e instanceof Error ? e.message : 'Dev simulate thất bại.');
		}
	}, [examSession?.pendingRegistrationId, form, handleUnlockReady, message]);

	const onUnlockFinish = useCallback(
		async (values: { examUnlockCode: string }) => {
			if (!examSession) return;
			await proceedWithUnlockCode(
				examSession,
				values.examUnlockCode,
				verifyStatus?.registrationId,
			);
		},
		[examSession, proceedWithUnlockCode, verifyStatus?.registrationId],
	);

	if (!leadId && !pendingRegistrationId) {
		return (
			<MockTestOnlineFunnelShell step="confirm_zalo">
				<MockTestOnlineSessionErrorAlert
					message="Liên kết không đầy đủ. Vui lòng chọn bài thi lại."
					step="b1_register_intake"
				/>
			</MockTestOnlineFunnelShell>
		);
	}

	if (sessionLoading) {
		return (
			<MockTestOnlineFunnelShell step="confirm_zalo">
				<div className="flex flex-col items-center justify-center py-12">
					<Spin size="large" />
					<Text type="secondary" className="mt-4">
						Đang chuẩn bị bài thi…
					</Text>
				</div>
			</MockTestOnlineFunnelShell>
		);
	}

	const apiError = sessionError ?? campaignsError;
	if (apiError) {
		return (
			<MockTestOnlineFunnelShell step="confirm_zalo">
				<MockTestOnlineSessionErrorAlert message={apiError} step="b2c_confirm_zalo" />
			</MockTestOnlineFunnelShell>
		);
	}

	if (!examSession) {
		return (
			<MockTestOnlineFunnelShell step="confirm_zalo">
				<MockTestOnlineSessionErrorAlert
					message="Không tải được thông tin xác minh. Vui lòng thử lại."
					step="b2c_confirm_zalo"
				/>
			</MockTestOnlineFunnelShell>
		);
	}

	const title = campaign?.title ?? examSession.campaignTitle ?? 'Bài thi online';
	const zaloDeadline = formatDeadline(examSession.zaloConfirmExpiresAt);

	return (
		<MockTestOnlineFunnelShell step="confirm_zalo">
			<Title level={3} className="mock-test-page-title !mb-1 !mt-0">
				Xác minh qua Zalo
			</Title>
			<Paragraph className="mock-test-intro-text !mb-4">
				Sao chép mã xác nhận và nhắn cho Zalo OA Ebest. Sau khi xác minh thành công,
				trang sẽ tự chuyển bạn vào phòng thi. Mục tiêu bước này là liên kết Zalo
				của bạn với hồ sơ đăng ký.
			</Paragraph>

			{authorizeError ? (
				<Alert
					type="error"
					showIcon
					className="!mb-4"
					message={authorizeError.title}
					description={
						<div className="space-y-3">
							<p className="mb-0">{authorizeError.description}</p>
							<div className="flex flex-wrap gap-2">
								{authorizeError.recovery === 'lead_tests' ? (
									<>
										<Button
											type="primary"
											onClick={() => {
												window.location.assign(
													PORTAL_MOCK_TEST_ROUTES.results,
												);
											}}
										>
											Xem lịch sử thi
										</Button>
										<Button
											onClick={() => {
												window.location.assign('/mock-test-online/register');
											}}
										>
											Đăng ký lại
										</Button>
									</>
								) : null}
								{authorizeError.recovery === 'restart' ? (
									<Button
										type="primary"
										onClick={() => {
											window.location.assign('/mock-test-online/register');
										}}
									>
										Bắt đầu lại
									</Button>
								) : null}
								{authorizeError.recovery === 'retry' || !authorizeError.recovery ? (
									<Button
										type="primary"
										onClick={() => {
											clearAuthorizeError();
											if (canProceedAfterZalo) onContinueAfterZalo();
										}}
									>
										Thử lại
									</Button>
								) : null}
							</div>
						</div>
					}
				/>
			) : null}

			{verifyIssue && !zaloVerified ? (
				<Alert
					type="error"
					showIcon
					className="!mb-4"
					message={verifyIssue.title}
					description={
						<div className="space-y-3">
							<p className="mb-0">{verifyIssue.description}</p>
							<div className="flex flex-wrap gap-2">
								<Button
									type="primary"
									onClick={() => {
										window.location.assign('/mock-test-online/register');
									}}
								>
									Đăng ký lại
								</Button>
								{verifyIssue.kind === 'zalo_linked_other_account' ? (
									<Button
										onClick={() => {
											window.location.assign('/login');
										}}
									>
										Đăng nhập cổng học viên
									</Button>
								) : null}
							</div>
						</div>
					}
				/>
			) : null}

			<Card className="mb-4 mock-test-confirm-exam-summary" bordered={false}>
				<Text type="secondary" className="text-xs block mb-1">
					Bài thi đã chọn
				</Text>
				<Title level={4} className="!mb-2 !mt-0 !font-semibold">
					{title}
				</Title>
				<div className="flex flex-wrap gap-2">
					{campaign?.testTypeCode ? (
						<Tag color="blue">{mockTestOnlineTypeLabel(campaign.testTypeCode)}</Tag>
					) : null}
					{variant ? (
						<Tag color="geekblue">
							{variant === 'full' ? 'Full test (200 câu)' : 'Mini test (50 câu)'}
						</Tag>
					) : null}
					{campaign?.estimatedDurationMinutes ? (
						<Tag icon={<ClockCircleOutlined />}>
							~{campaign.estimatedDurationMinutes} phút
						</Tag>
					) : null}
				</div>
				{campaign?.marketingBlurb ? (
					<Paragraph className="!mb-0 !mt-3 text-sm" type="secondary">
						{campaign.marketingBlurb}
					</Paragraph>
				) : null}
			</Card>

			<Card
				title={
					<span>
						<MessageOutlined className="mr-2" />
						Bước 1 — Gửi tin nhắn Zalo
					</span>
				}
				size="small"
				className="mb-4"
			>
				<Paragraph className="!mb-3 text-sm">
					Sao chép hoặc bấm <strong>Mở Zalo và gửi</strong>, rồi gửi{' '}
					<strong>nguyên văn</strong> nội dung bên dưới. Sau khi Zalo OA xác nhận,
					trang web sẽ tự chuyển bạn vào phòng thi.
				</Paragraph>
				{zaloDeadline ? (
					<Alert
						type="warning"
						showIcon
						className="!mb-3"
						message={`Gửi tin trước ${zaloDeadline}`}
					/>
				) : null}
				<ZaloConfirmMessageBlock
					message={zaloMessage}
					zaloDeepLink={examSession?.zaloDeepLink}
					zaloOaChatUrl={examSession?.zaloOaChatUrl}
					zaloOaId={examSession?.zaloOaId}
				/>
				{IS_DEV ? (
					<div className="mt-3">
						<Button
							size="small"
							type="dashed"
							danger
							onClick={() => void devSimulateZalo()}
						>
							Dev: bỏ qua Zalo
						</Button>
					</div>
				) : null}
				<div className="mock-test-online-poll-box">
					{zaloVerified ? (
						<>
							<Alert
								type="success"
								showIcon
								icon={<CheckCircleOutlined />}
								message="Đã xác minh Zalo"
								description={
									autoProceeding
										? 'Đang chuyển bạn vào phòng làm bài…'
										: canProceedAfterZalo
											? 'Bạn có thể vào làm bài ngay — không cần nhập lại mã.'
											: needsUnlockCode
												? 'Hệ thống đang đồng bộ đăng ký. Nếu chưa tự chuyển, nhập mã 6 ký tự từ Zalo OA ở bước 2.'
												: 'Đang đồng bộ đăng ký… Giữ tab này mở.'
								}
							/>
							{needsUnlockCode && !autoProceeding ? (
								<div className="flex items-center gap-2 mt-3">
									<Spin size="small" />
									<Text type="secondary" className="text-sm">
										Đang đồng bộ đăng ký…
									</Text>
								</div>
							) : null}
							{canProceedAfterZalo && !autoProceeding ? (
								<Button
									type="primary"
									size="large"
									block
									className="!mt-3"
									onClick={onContinueAfterZalo}
									loading={submittingUnlock}
								>
									Tiếp tục làm bài
								</Button>
							) : null}
						</>
					) : verifyIssue ? (
						<div>
							<Text strong className="block">
								Không xác minh được với Zalo hiện tại
							</Text>
							<Text type="secondary" className="text-sm">
								Xem hướng dẫn phía trên. Sau khi dùng đúng Zalo và gửi lại tin, trang
								sẽ cập nhật.
							</Text>
							{verifyError ? (
								<Text type="danger" className="text-sm block mt-1">
									{verifyError}
								</Text>
							) : null}
						</div>
					) : (
						<div className="flex items-start gap-3">
							<Spin size="small" className="!mt-1" />
							<div>
								<Text strong className="block">
									Đang chờ xác minh…
								</Text>
								<Text type="secondary" className="text-sm">
									Sau khi gửi tin Zalo thành công, trang sẽ tự chuyển. Giữ tab này
									mở.
								</Text>
								{verifyError ? (
									<Text type="danger" className="text-sm block mt-1">
										{verifyError}
									</Text>
								) : null}
							</div>
						</div>
					)}
				</div>
			</Card>

			<Card
				title={
					needsUnlockCode
						? 'Bước 2 — Nhập mã làm bài'
						: canProceedAfterZalo
							? 'Bước 2 — Mã dự phòng (nếu cần)'
							: 'Bước 2 — Mã dự phòng (nếu trang không tự chuyển)'
				}
				size="small"
			>
				<Paragraph className="!mb-3 text-sm" type="secondary">
					{needsUnlockCode
						? 'Nhập mã 6 ký tự từ tin nhắn Zalo OA Ebest để vào phòng làm bài. Mất mã? Gửi lại tin xác nhận trên Zalo — OA sẽ gửi lại mã.'
						: canProceedAfterZalo
							? 'Chỉ cần khi nút «Tiếp tục làm bài» không hoạt động. Nhập mã 6 ký tự từ tin nhắn OA Ebest.'
							: 'Trên web, sau khi xác minh Zalo trang thường tự chuyển — không cần nhập mã. Chỉ dùng ô này nếu trang vẫn đứng yên sau khi đã gửi tin thành công.'}
				</Paragraph>
				<Form form={form} layout="vertical" onFinish={onUnlockFinish}>
					<Form.Item
						name="examUnlockCode"
						label="Mã làm bài"
						rules={mockTestUnlockCodeFormRules}
					>
						<Input
							placeholder="VD: EB7X3K"
							maxLength={12}
							className="uppercase tracking-widest"
							size="large"
							disabled={submittingUnlock || autoProceeding}
							inputMode="text"
							autoComplete="one-time-code"
						/>
					</Form.Item>
					<Form.Item className="!mb-0">
						<Button
							type="primary"
							htmlType="submit"
							size="large"
							block
							loading={submittingUnlock || autoProceeding}
						>
							Vào phòng làm bài
						</Button>
					</Form.Item>
				</Form>
			</Card>
		</MockTestOnlineFunnelShell>
	);
}
