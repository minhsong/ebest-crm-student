'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	App,
	Button,
	Form,
	Input,
	Radio,
	Typography,
} from 'antd';
import type {
	MockTestOnlineCampaign,
	MockTestOnlineAttemptStatus,
	MockTestOnlineSelectExamFormValues,
} from '@/lib/public-mock-test-online/types';
import {
	mockTestOnlineTypeLabel,
	writeSelectExamCache,
} from '@/lib/public-mock-test-online/exam-flow.util';
import { postMockTestOnlineSelectExam } from '@/lib/public-mock-test-online/mock-test-online-api.client';
import { MockTestOnlineApiError } from '@/lib/public-mock-test-online/mock-test-online-api-error';
import { buildMockTestOnlineExamReadyPath } from '@/lib/public-mock-test-online/mock-test-online-exam-url.util';
import type { MockTestErrorDiagnostics } from '@/lib/public-mock-test-online/mock-test-error-details';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestOnlineSessionErrorAlert } from '@/components/public-mock-test-online/MockTestOnlineSessionErrorAlert';
import { MockTestOnlineInExamResumeAlert } from '@/components/public-mock-test-online/MockTestOnlineInExamResumeAlert';
import { MockTestOnlineAttemptLimitAlert } from '@/components/public-mock-test-online/MockTestOnlineAttemptLimitAlert';
import { MockTestOnlineExamTypePicker } from '@/components/public-mock-test-online/MockTestOnlineExamTypePicker';
import { isMockTestOnlineAttemptBlocked } from '@/lib/public-mock-test-online/mock-test-online-attempt-limit.util';
import {
	isMockTestOnlineControlledAttemptGateError,
	resolveMockTestOnlineErrorCopy,
} from '@/lib/public-mock-test-online/mock-test-online-session-errors.util';
import {
	clearMtoExamIntent,
	readMtoExamIntent,
} from '@/lib/public-mock-test-online/mto-exam-intent';

const { Text, Title, Paragraph } = Typography;

export type MockTestOnlineSelectExamFormProps = {
	/** Legacy Funnel id — auth-first có thể để trống; ownership từ session/BFF. */
	pendingLeadId?: string;
	campaigns: MockTestOnlineCampaign[];
	selectedCampaign: MockTestOnlineCampaign | null;
	campaignsError?: string | null;
	attemptStatus?: MockTestOnlineAttemptStatus | null;
	/** Prefill variant từ returnUrl (browse-first B). */
	initialVariant?: 'full' | 'mini';
};

export function MockTestOnlineSelectExamForm({
	pendingLeadId = '',
	campaigns,
	selectedCampaign,
	campaignsError = null,
	attemptStatus = null,
	initialVariant,
}: MockTestOnlineSelectExamFormProps) {
	const router = useRouter();
	const { message } = App.useApp();
	const [form] = Form.useForm<MockTestOnlineSelectExamFormValues>();
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<{
		message: string;
		errorCode?: string;
		diagnostics?: MockTestErrorDiagnostics;
	} | null>(null);

	const sessionId = Form.useWatch('sessionId', form) ?? selectedCampaign?.sessionId;

	useEffect(() => {
		form.setFieldValue('pendingLeadId', pendingLeadId);
		const fromLs = readMtoExamIntent();
		const id =
			selectedCampaign?.sessionId ??
			fromLs?.sessionId ??
			(campaigns.length === 1 ? campaigns[0]?.sessionId : undefined);
		if (id) form.setFieldValue('sessionId', id);
		const variant =
			initialVariant ??
			fromLs?.testVariantChoice ??
			undefined;
		if (variant === 'full' || variant === 'mini') {
			form.setFieldValue('testVariantChoice', variant);
		}
	}, [pendingLeadId, selectedCampaign, campaigns, form, initialVariant]);

	const activeCampaign = useMemo(() => {
		if (sessionId) {
			return campaigns.find((c) => c.sessionId === sessionId) ?? selectedCampaign;
		}
		return selectedCampaign;
	}, [campaigns, selectedCampaign, sessionId]);

	const onFinish = useCallback(
		async (values: MockTestOnlineSelectExamFormValues) => {
			const resolvedSessionId =
				values.sessionId ??
				selectedCampaign?.sessionId ??
				(campaigns.length === 1 ? campaigns[0]?.sessionId : undefined);
			if (!resolvedSessionId || resolvedSessionId < 1) {
				message.error('Vui lòng chọn bài thi.');
				return;
			}

			const lead = values.pendingLeadId || pendingLeadId;
			setSubmitting(true);
			setSubmitError(null);
			try {
				const data = await postMockTestOnlineSelectExam({
					sessionId: resolvedSessionId,
					testVariantChoice: values.testVariantChoice,
				});
				clearMtoExamIntent();

				// Đã Zalo unlock chưa start — vào phòng chờ, Start mới tính giờ.
				if (
					data.resumePhase === 'ready' &&
					data.registrationId != null &&
					data.registrationId >= 1
				) {
					router.push(
						buildMockTestOnlineExamReadyPath({
							registrationId: data.registrationId,
						}),
					);
					return;
				}

				const ownershipKey =
					(data as { accountId?: string }).accountId?.trim() ||
					data.pendingLeadId?.trim() ||
					lead ||
					'';

				const campaignTitle =
					campaigns.find((c) => c.sessionId === resolvedSessionId)?.title ??
					selectedCampaign?.title;

				writeSelectExamCache({
					pendingLeadId: ownershipKey,
					sessionId: resolvedSessionId,
					testVariantChoice: values.testVariantChoice,
					pendingRegistrationId: data.pendingRegistrationId,
					registrationId: data.registrationId ?? null,
					zaloDeepLink: data.zaloDeepLink ?? '',
					zaloOaChatUrl:
						data.zaloOaChatUrl ||
						(data.zaloOaId ? `https://zalo.me/${data.zaloOaId}` : ''),
					zaloOaId: data.zaloOaId,
					zaloConfirmMessage: data.zaloConfirmMessage,
					zaloConfirmExpiresAt:
						data.zaloConfirmExpiresAt ?? data.examSessionExpiresAt ?? '',
					examSessionToken: data.examSessionToken,
					examSessionExpiresAt: data.examSessionExpiresAt,
					campaignTitle,
					verificationChannel: data.verificationChannel,
					nextStep: data.nextStep,
				});

				if (
					!data.zaloConfirmMessage?.trim() &&
					!(data.zaloDeepLink && String(data.zaloDeepLink).includes('msg='))
				) {
					message.error(
						'Hệ thống chưa tạo được mã Zalo. Vui lòng thử chọn lại bài thi.',
					);
					return;
				}

				const params = new URLSearchParams();
				if (ownershipKey) params.set('lead', ownershipKey);
				params.set('session', String(resolvedSessionId));
				params.set('pending', data.pendingRegistrationId);
				if (values.testVariantChoice) {
					params.set('variant', values.testVariantChoice);
				}
				router.push(`/mock-test-online/confirm-exam?${params.toString()}`);
			} catch (e) {
				if (e instanceof MockTestOnlineApiError) {
					const gateCopy = resolveMockTestOnlineErrorCopy({
						message: e.message,
						errorCode: e.errorCode,
						step: 'b2_select_exam',
					});
					if (
						isMockTestOnlineControlledAttemptGateError(e.errorCode, e.message)
					) {
						message.warning(gateCopy.title);
					}
					setSubmitError({
						message: e.message,
						errorCode: e.errorCode,
						diagnostics: {
							code: e.errorCode,
							rawMessage: e.detail ?? e.message,
							errorName: e.name,
							path: 'b2_select_exam',
							httpStatus: e.httpStatus,
							occurredAt: new Date().toISOString(),
						},
					});
				} else {
					setSubmitError({
						message:
							e instanceof Error
								? e.message
								: 'Không khởi tạo được phiên bài thi.',
						diagnostics: {
							rawMessage:
								e instanceof Error
									? `${e.name}: ${e.message}`
									: String(e),
							path: 'b2_select_exam',
							occurredAt: new Date().toISOString(),
							stack: e instanceof Error ? e.stack?.slice(0, 2500) : undefined,
						},
					});
				}
			} finally {
				setSubmitting(false);
			}
		},
		[message, router, pendingLeadId, selectedCampaign, campaigns],
	);

	if (submitError) {
		return (
			<MockTestOnlineFunnelShell step="select_exam">
				<MockTestOnlineSessionErrorAlert
					message={submitError.message}
					errorCode={submitError.errorCode}
					step="b2_select_exam"
					diagnostics={submitError.diagnostics}
					onDismiss={() => setSubmitError(null)}
				/>
			</MockTestOnlineFunnelShell>
		);
	}

	const activeInExam = attemptStatus?.activeInExam?.resumeAllowed ?? false;
	const attemptLimitReached = isMockTestOnlineAttemptBlocked(attemptStatus, {
		sessionId: typeof sessionId === 'number' ? sessionId : selectedCampaign?.sessionId,
	});

	return (
		<MockTestOnlineFunnelShell step="select_exam">
			<Title level={3} className="mock-test-page-title !mb-1 !mt-0">
				Hãy chọn bài thi thử
			</Title>
			<Paragraph className="mock-test-intro-text !mb-4">
				Chọn bài phù hợp mục đích đánh giá năng lực tiếng Anh của bạn, rồi bấm
				Tiếp tục.
			</Paragraph>

			<MockTestOnlineInExamResumeAlert attemptStatus={attemptStatus} />

			<MockTestOnlineAttemptLimitAlert
				attemptStatus={attemptStatus}
				sessionId={
					typeof sessionId === 'number' ? sessionId : selectedCampaign?.sessionId
				}
			/>

			{campaignsError ? (
				<Alert type="error" showIcon message={campaignsError} className="!mb-4" />
			) : null}

			{campaigns.length === 0 && !campaignsError ? (
				<Alert
					type="info"
					showIcon
					className="!mb-4"
					message="Hiện chưa có bài thi đang mở"
					description="Vui lòng thử lại sau hoặc liên hệ Ebest để được hỗ trợ."
				/>
			) : null}

			<Form
				form={form}
				layout="vertical"
				onFinish={onFinish}
				initialValues={{
					pendingLeadId,
					sessionId: selectedCampaign?.sessionId,
				}}
			>
				<Form.Item name="pendingLeadId" hidden>
					<Input />
				</Form.Item>

				{campaigns.length > 0 ? (
					<Form.Item
						name="sessionId"
						rules={[{ required: true, message: 'Vui lòng chọn bài thi.' }]}
						className="!mb-4"
					>
						<MockTestOnlineExamTypePicker campaigns={campaigns} />
					</Form.Item>
				) : (
					<Form.Item name="sessionId" hidden>
						<Input type="hidden" />
					</Form.Item>
				)}

				{activeCampaign?.variantMode === 'user_choice' ? (
					<Form.Item
						name="testVariantChoice"
						label="Chọn loại đề"
						extra="Full test mô phỏng đầy đủ; Mini test phù hợp thử nhanh trong ~15 phút."
						rules={[{ required: true, message: 'Vui lòng chọn loại đề.' }]}
					>
						<Radio.Group className="mock-test-variant-radio-group">
							<Radio value="full">
								<Text strong>Đề đầy đủ (Full test)</Text>
								<Text type="secondary" className="block text-xs">
									200 câu — mô phỏng bài thi thật
								</Text>
							</Radio>
							<Radio value="mini">
								<Text strong>Đề rút gọn (Mini test)</Text>
								<Text type="secondary" className="block text-xs">
									50 câu — làm nhanh, phù hợp lần thử đầu
								</Text>
							</Radio>
						</Radio.Group>
					</Form.Item>
				) : null}

				{activeCampaign && activeCampaign.variantMode !== 'user_choice' ? (
					<Text type="secondary" className="block text-sm !mb-4">
						Đã chọn: {activeCampaign.title}
						{activeCampaign.testTypeCode
							? ` · ${mockTestOnlineTypeLabel(activeCampaign.testTypeCode)}`
							: ''}
					</Text>
				) : null}

				<Form.Item className="!mb-0">
					<Button
						type="primary"
						htmlType="submit"
						size="large"
						block
						loading={submitting}
						disabled={campaigns.length === 0 || activeInExam || attemptLimitReached}
					>
						Tiếp tục
					</Button>
				</Form.Item>
			</Form>
		</MockTestOnlineFunnelShell>
	);
}
