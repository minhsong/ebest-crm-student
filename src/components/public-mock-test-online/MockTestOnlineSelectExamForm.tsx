'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
	Alert,
	App,
	Button,
	Card,
	Form,
	Input,
	Radio,
	Space,
	Tag,
	Typography,
} from 'antd';
import { ClockCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import type {
	MockTestOnlineCampaign,
	MockTestOnlineAttemptStatus,
	MockTestOnlineSelectExamFormValues,
} from '@/lib/public-mock-test-online/types';
import {
	groupCampaignsByTestType,
	formatMockTestRegistrationDeadline,
	mockTestOnlineTypeLabel,
	writeSelectExamCache,
} from '@/lib/public-mock-test-online/exam-flow.util';
import { postMockTestOnlineSelectExam } from '@/lib/public-mock-test-online/mock-test-online-api.client';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestOnlineSessionErrorAlert } from '@/components/public-mock-test-online/MockTestOnlineSessionErrorAlert';
import { MockTestOnlineInExamResumeAlert } from '@/components/public-mock-test-online/MockTestOnlineInExamResumeAlert';
import { MockTestOnlineAttemptLimitAlert } from '@/components/public-mock-test-online/MockTestOnlineAttemptLimitAlert';
import { isMockTestOnlineAttemptBlocked } from '@/lib/public-mock-test-online/mock-test-online-attempt-limit.util';

const { Text, Title, Paragraph } = Typography;

export type MockTestOnlineSelectExamFormProps = {
	pendingLeadId: string;
	campaigns: MockTestOnlineCampaign[];
	selectedCampaign: MockTestOnlineCampaign | null;
	campaignsError?: string | null;
	attemptStatus?: MockTestOnlineAttemptStatus | null;
};

function formatDuration(minutes: number | null | undefined): string | null {
	if (!minutes || minutes < 1) return null;
	return `~${minutes} phút`;
}

export function MockTestOnlineSelectExamForm({
	pendingLeadId,
	campaigns,
	selectedCampaign,
	campaignsError = null,
	attemptStatus = null,
}: MockTestOnlineSelectExamFormProps) {
	const router = useRouter();
	const { message } = App.useApp();
	const [form] = Form.useForm<MockTestOnlineSelectExamFormValues>();
	const [submitting, setSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	const sessionId = Form.useWatch('sessionId', form) ?? selectedCampaign?.sessionId;

	useEffect(() => {
		form.setFieldValue('pendingLeadId', pendingLeadId);
		const id =
			selectedCampaign?.sessionId ??
			(campaigns.length === 1 ? campaigns[0]?.sessionId : undefined);
		if (id) form.setFieldValue('sessionId', id);
	}, [pendingLeadId, selectedCampaign, campaigns, form]);

	const grouped = useMemo(() => groupCampaignsByTestType(campaigns), [campaigns]);

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
					pendingLeadId: lead,
					sessionId: resolvedSessionId,
					testVariantChoice: values.testVariantChoice,
				});

				const campaignTitle =
					campaigns.find((c) => c.sessionId === resolvedSessionId)?.title ??
					selectedCampaign?.title;

				writeSelectExamCache({
					pendingLeadId: lead,
					sessionId: resolvedSessionId,
					testVariantChoice: values.testVariantChoice,
					pendingRegistrationId: data.pendingRegistrationId,
					zaloDeepLink: data.zaloDeepLink,
					zaloOaChatUrl:
						data.zaloOaChatUrl ||
						(data.zaloOaId ? `https://zalo.me/${data.zaloOaId}` : ''),
					zaloOaId: data.zaloOaId,
					zaloConfirmMessage: data.zaloConfirmMessage,
					zaloConfirmExpiresAt: data.zaloConfirmExpiresAt,
					examSessionToken: data.examSessionToken,
					examSessionExpiresAt: data.examSessionExpiresAt,
					campaignTitle,
				});

				const params = new URLSearchParams();
				params.set('lead', lead);
				params.set('session', String(resolvedSessionId));
				params.set('pending', data.pendingRegistrationId);
				if (values.testVariantChoice) {
					params.set('variant', values.testVariantChoice);
				}
				router.push(`/mock-test-online/confirm-exam?${params.toString()}`);
			} catch (e) {
				setSubmitError(
					e instanceof Error ? e.message : 'Không khởi tạo được phiên bài thi.',
				);
			} finally {
				setSubmitting(false);
			}
		},
		[message, router, pendingLeadId, selectedCampaign, campaigns],
	);

	if (!pendingLeadId?.trim()) {
		return (
			<MockTestOnlineFunnelShell step="select_exam">
				<MockTestOnlineSessionErrorAlert
					message="Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại."
					step="b1_register_intake"
				/>
			</MockTestOnlineFunnelShell>
		);
	}

	if (submitError) {
		return (
			<MockTestOnlineFunnelShell step="select_exam">
				<MockTestOnlineSessionErrorAlert message={submitError} step="b2_select_exam" />
			</MockTestOnlineFunnelShell>
		);
	}

	const activeInExam = attemptStatus?.activeInExam?.resumeAllowed ?? false;
	const attemptLimitReached = isMockTestOnlineAttemptBlocked(attemptStatus);

	return (
		<MockTestOnlineFunnelShell step="select_exam">
			<Title level={3} className="mock-test-page-title !mb-1 !mt-0">
				Chọn bài thi
			</Title>
			<Paragraph className="mock-test-intro-text !mb-4">
				Chọn đúng loại đề và chiến dịch bạn muốn thi. Bước tiếp theo: xác minh qua Zalo
				— trang sẽ tự chuyển vào phòng thi sau khi xác nhận thành công.
			</Paragraph>

			<MockTestOnlineInExamResumeAlert attemptStatus={attemptStatus} />

			<MockTestOnlineAttemptLimitAlert attemptStatus={attemptStatus} />

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

				{campaigns.length > 1 ? (
					<Form.Item
						name="sessionId"
						label="Bài thi"
						rules={[{ required: true, message: 'Vui lòng chọn bài thi.' }]}
					>
						<Radio.Group className="w-full">
							<Space direction="vertical" className="w-full" size="middle">
								{grouped.map((group) => (
									<div key={group.testTypeCode}>
										<Text strong className="mb-2 block text-sm">
											{group.label}
										</Text>
										<Space direction="vertical" className="w-full" size="small">
											{group.items.map((c) => {
												const duration = formatDuration(c.estimatedDurationMinutes);
												const deadline = formatMockTestRegistrationDeadline(
													c.registrationDeadlineAt,
												);
												const selected = sessionId === c.sessionId;
												const typeLabel = mockTestOnlineTypeLabel(c.testTypeCode);
												return (
													<Radio key={c.sessionId} value={c.sessionId} className="!m-0">
														<Card
															size="small"
															className={`mock-test-campaign-card ${selected ? 'mock-test-campaign-card--selected' : ''}`}
															onClick={() =>
																form.setFieldValue('sessionId', c.sessionId)
															}
														>
															<div className="mock-test-campaign-card-head">
																<Text strong className="mock-test-campaign-card-title">
																	{c.title}
																</Text>
																<Tag color="blue" className="!m-0">
																	{typeLabel}
																</Tag>
															</div>
															<div className="mock-test-campaign-card-meta">
																{duration ? (
																	<Text type="secondary" className="text-xs">
																		<ClockCircleOutlined className="mr-1" />
																		Thời lượng {duration}
																	</Text>
																) : null}
																{deadline ? (
																	<Text type="secondary" className="text-xs">
																		<FileTextOutlined className="mr-1" />
																		Hạn đăng ký: {deadline}
																	</Text>
																) : null}
																{c.variantMode === 'user_choice' ? (
																	<Tag className="!m-0">Chọn Full hoặc Mini</Tag>
																) : null}
															</div>
														</Card>
													</Radio>
												);
											})}
										</Space>
									</div>
								))}
							</Space>
						</Radio.Group>
					</Form.Item>
				) : (
					<>
						<Form.Item name="sessionId" hidden>
							<Input type="hidden" />
						</Form.Item>
						{campaigns[0] ? (
							<Card size="small" className="mock-test-campaign-card mock-test-campaign-card--selected !mb-4">
								<div className="mock-test-campaign-card-head">
									<Text strong className="mock-test-campaign-card-title">
										{campaigns[0].title}
									</Text>
									<Tag color="blue">
										{mockTestOnlineTypeLabel(campaigns[0].testTypeCode)}
									</Tag>
								</div>
								<div className="mock-test-campaign-card-meta">
									{formatDuration(campaigns[0].estimatedDurationMinutes) ? (
										<Tag icon={<ClockCircleOutlined />}>
											Thời lượng {formatDuration(campaigns[0].estimatedDurationMinutes)}
										</Tag>
									) : null}
									{formatMockTestRegistrationDeadline(
										campaigns[0].registrationDeadlineAt,
									) ? (
										<Tag icon={<FileTextOutlined />}>
											Hạn đăng ký:{' '}
											{formatMockTestRegistrationDeadline(
												campaigns[0].registrationDeadlineAt,
											)}
										</Tag>
									) : null}
								</div>
							</Card>
						) : null}
					</>
				)}

				{activeCampaign?.marketingBlurb ? (
					<Alert
						type="info"
						showIcon
						className="!mb-4"
						message="Giới thiệu bài thi"
						description={activeCampaign.marketingBlurb}
					/>
				) : null}

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

				{activeCampaign ? (
					<Alert
						type="success"
						showIcon
						className="!mb-4 mock-test-select-exam-summary"
						message="Bạn sẽ thi"
						description={
							<>
								<Text strong className="block">{activeCampaign.title}</Text>
								<Text type="secondary" className="text-sm">
									Loại đề: {mockTestOnlineTypeLabel(activeCampaign.testTypeCode)}
									{activeCampaign.variantMode === 'user_choice'
										? ' — chọn Full hoặc Mini ở trên'
										: ''}
								</Text>
							</>
						}
					/>
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
						Tiếp tục — xác minh Zalo
					</Button>
				</Form.Item>
			</Form>
		</MockTestOnlineFunnelShell>
	);
}
