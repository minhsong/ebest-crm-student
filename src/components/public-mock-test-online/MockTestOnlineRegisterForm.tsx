'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
	Alert,
	App,
	Button,
	Checkbox,
	Divider,
	Form,
	Input,
	Space,
	Typography,
} from 'antd';
import { collectPublicProfilePayload } from '@/lib/public-mock-test/profile-payload';
import { publicMockTestFormRules } from '@/lib/public-mock-test/validation';
import { PhoneInputField } from '@/components/phone-input';
import { PublicMockTestProfileFields } from '@/components/public-mock-test/PublicMockTestProfileFields';
import { MockTestOnlineFunnelShell } from '@/components/public-mock-test-online/MockTestOnlineFunnelShell';
import { MockTestOnlineInExamResumeAlert } from '@/components/public-mock-test-online/MockTestOnlineInExamResumeAlert';
import { executeRecaptchaMockTestOnlineIntake } from '@/lib/public-mock-test-online/recaptcha';
import type {
	MockTestOnlineAttemptStatus,
	MockTestOnlineLeadIntakeResponse,
	MockTestOnlineRegisterFormValues,
} from '@/lib/public-mock-test-online/types';
import type { PublicRegistrationOptions } from '@/lib/public-mock-test/types';
import {
	clearIntakeDraft,
	readIntakeDraft,
	writeIntakeDraft,
} from '@/lib/public-mock-test-online/mock-test-online-intake-draft';
import { extractMockTestOnlineApiError } from '@/lib/public-mock-test-online/mock-test-online-api-error';
import {
	mockTestOnlineErrorCopyFromUnknown,
	resolveMockTestOnlineApiErrorCopy,
} from '@/lib/public-mock-test-online/mock-test-online-session-errors.util';
import { PORTAL_MOCK_TEST_RESULTS_ROUTES } from '@/lib/portal-auth/session-routes';
import { useFanpageContactUrl } from '@/contexts/portal-contact-links-context';
import { ContactSupportRichText } from '@/components/portal-contact/ContactSupportRichText';

const { Text, Title, Paragraph } = Typography;

type IntakeUiError = {
	title: string;
	description: string;
	errorCode?: string;
	action?: 'login' | 'contact_support' | 'retry';
};

export type MockTestOnlineRegisterFormProps = {
	profileOptions: PublicRegistrationOptions | null;
	profileOptionsError?: string | null;
	initialContact?: {
		displayName?: string;
		primaryPhone?: string;
		primaryEmail?: string;
	} | null;
	widgetTitle?: string;
	widgetIntro?: string;
	attemptStatus?: MockTestOnlineAttemptStatus | null;
	/** Đang có bài làm dở — ẩn form đăng ký mới. */
	intakeBlocked?: boolean;
};

export function MockTestOnlineRegisterForm({
	profileOptions,
	profileOptionsError = null,
	initialContact = null,
	widgetTitle = 'Đăng ký',
	widgetIntro = 'Điền thông tin liên hệ để bắt đầu. Sau bước này bạn sẽ chọn bài thi và xác minh qua Zalo.',
	attemptStatus = null,
	intakeBlocked = false,
}: MockTestOnlineRegisterFormProps) {
	const router = useRouter();
	const { message } = App.useApp();
	const fanpageUrl = useFanpageContactUrl();
	const [form] = Form.useForm<MockTestOnlineRegisterFormValues>();
	const [submitting, setSubmitting] = useState(false);
	const [intakeError, setIntakeError] = useState<IntakeUiError | null>(null);
	const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	const loginHref = useMemo(() => {
		const returnUrl = encodeURIComponent('/mock-test-online');
		return `${PORTAL_MOCK_TEST_RESULTS_ROUTES.login}?returnUrl=${returnUrl}`;
	}, []);

	useEffect(() => {
		const draft = readIntakeDraft();
		if (!draft) return;
		form.setFieldsValue({
			displayName: draft.displayName ?? initialContact?.displayName ?? '',
			primaryPhone: draft.primaryPhone ?? initialContact?.primaryPhone ?? '',
			primaryEmail: draft.primaryEmail ?? initialContact?.primaryEmail ?? '',
			consentMarketing: draft.consentMarketing ?? false,
			resultDeliveryEmail: draft.resultDeliveryEmail ?? false,
			...draft,
		});
	}, [form, initialContact]);

	useEffect(() => {
		return () => {
			if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
		};
	}, []);

	const scheduleDraftSave = useCallback(
		(values: Partial<MockTestOnlineRegisterFormValues>) => {
			if (draftSaveTimer.current) clearTimeout(draftSaveTimer.current);
			draftSaveTimer.current = setTimeout(() => writeIntakeDraft(values), 400);
		},
		[],
	);

	const onFinish = useCallback(
		async (values: MockTestOnlineRegisterFormValues) => {
			setSubmitting(true);
			setIntakeError(null);
			try {
				const recaptchaToken = await executeRecaptchaMockTestOnlineIntake();
				const profile = collectPublicProfilePayload(values);
				const { expectedScore: _omitExpected, ...profileWithoutExpected } =
					profile;
				const res = await fetch('/api/public/mock-test-online/intake', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						displayName: values.displayName.trim(),
						primaryPhone: values.primaryPhone?.trim(),
						primaryEmail: values.primaryEmail?.trim() || undefined,
						resultDeliveryEmail: Boolean(values.resultDeliveryEmail),
						consentMarketing: values.consentMarketing,
						recaptchaToken,
						...profileWithoutExpected,
					}),
				});
				const data = (await res.json()) as MockTestOnlineLeadIntakeResponse &
					Record<string, unknown>;
				if (!res.ok) {
					const extracted = extractMockTestOnlineApiError(data);
					const inferredCode =
						extracted.errorCode ??
						(/email.*đã được dùng|đã được dùng trên cổng/i.test(
							extracted.message,
						)
							? 'EMAIL_ALREADY_IN_SYSTEM'
							: /số điện thoại này đã gắn/i.test(extracted.message)
								? 'PHONE_ALREADY_IN_SYSTEM'
								: undefined);
					const copy = resolveMockTestOnlineApiErrorCopy({
						message: extracted.message,
						errorCode: inferredCode,
						step: 'b1_register_intake',
					});
					const action =
						extracted.action ??
						(copy.recovery === 'login' ||
						copy.recovery === 'contact_support' ||
						copy.recovery === 'retry'
							? copy.recovery
							: 'retry');
					const description =
						inferredCode === 'RATE_LIMITED' && extracted.message.trim()
							? extracted.message
							: inferredCode &&
								  extracted.message.trim() &&
								  extracted.message.trim() !== copy.title
								? extracted.message
								: copy.description;
					setIntakeError({
						title: copy.title,
						description,
						errorCode: inferredCode,
						action,
					});
					return;
				}

				if (!data.pendingLeadId) {
					setIntakeError({
						title: 'Không nhận được phản hồi đăng ký',
						description:
							'Vui lòng thử lại. Nếu vẫn lỗi, liên hệ Fanpage Ebest để được hỗ trợ.',
						action: 'retry',
					});
					return;
				}

				message.success('Đăng ký thành công. Chọn bài thi tiếp theo nhé!');
				clearIntakeDraft();
				router.push(
					`/mock-test-online/select-exam?lead=${encodeURIComponent(data.pendingLeadId)}`,
				);
			} catch (e) {
				const copy = mockTestOnlineErrorCopyFromUnknown(
					e,
					'b1_register_intake',
					'Đăng ký thất bại',
				);
				setIntakeError({
					title: copy.title,
					description: copy.description,
					action:
						copy.recovery === 'login' ||
						copy.recovery === 'contact_support' ||
						copy.recovery === 'retry'
							? copy.recovery
							: 'retry',
				});
			} finally {
				setSubmitting(false);
			}
		},
		[message, router],
	);

	return (
		<MockTestOnlineFunnelShell step="register">
			<Title level={3} className="mock-test-page-title !mb-1 !mt-0">
				{widgetTitle}
			</Title>
			<Paragraph className="mock-test-intro-text !mb-4">{widgetIntro}</Paragraph>

			<MockTestOnlineInExamResumeAlert attemptStatus={attemptStatus} />

			{intakeBlocked ? (
				<Paragraph type="secondary" className="!mb-0">
					Hoàn thành bài thi đang làm dở trước khi đăng ký lượt thi mới.
				</Paragraph>
			) : (
				<Form
					form={form}
					layout="vertical"
					onFinish={onFinish}
					onValuesChange={(_, allValues) => {
						setIntakeError(null);
						scheduleDraftSave(allValues);
					}}
					initialValues={{
						displayName: initialContact?.displayName ?? '',
						primaryPhone: initialContact?.primaryPhone ?? '',
						primaryEmail: initialContact?.primaryEmail ?? '',
						consentMarketing: false,
						resultDeliveryEmail: false,
					}}
				>
					{intakeError ? (
						<Alert
							className="!mb-4"
							type="warning"
							showIcon
							message={
								<ContactSupportRichText text={intakeError.title} />
							}
							description={
								<ContactSupportRichText text={intakeError.description} />
							}
							action={
								<Space direction="vertical" size="small">
									{intakeError.action === 'login' ? (
										<Link href={loginHref}>
											<Button type="primary" size="small">
												Đăng nhập cổng học viên
											</Button>
										</Link>
									) : null}
									{intakeError.action === 'contact_support' ||
									intakeError.action === 'login' ||
									intakeError.action === 'retry' ? (
										<Button
											size="small"
											href={fanpageUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											Nhắn tin Fanpage Ebest
										</Button>
									) : null}
									{intakeError.action === 'retry' ? (
										<Button
											size="small"
											onClick={() => {
												setIntakeError(null);
												form.submit();
											}}
										>
											Thử lại
										</Button>
									) : null}
								</Space>
							}
						/>
					) : null}

					<Text strong className="mock-test-section-title">
						Thông tin liên hệ
					</Text>
					<Form.Item
						name="displayName"
						label="Họ và tên"
						rules={publicMockTestFormRules.displayName}
					>
						<Input
							placeholder="Nguyễn Văn A"
							maxLength={255}
							autoComplete="name"
						/>
					</Form.Item>
					<Form.Item
						name="primaryPhone"
						label="Số điện thoại"
						rules={publicMockTestFormRules.primaryPhone}
						getValueFromEvent={(v: string | undefined) => v}
					>
						<PhoneInputField placeholder="0901234567" />
					</Form.Item>
					<Form.Item
						name="primaryEmail"
						label="Email (tuỳ chọn)"
						dependencies={['resultDeliveryEmail']}
						rules={[
							{ type: 'email', message: 'Email không hợp lệ' },
							{ max: 255, message: 'Email tối đa 255 ký tự' },
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!getFieldValue('resultDeliveryEmail')) {
										return Promise.resolve();
									}
									if (typeof value === 'string' && value.trim()) {
										return Promise.resolve();
									}
									return Promise.reject(
										new Error(
											'Vui lòng nhập email để nhận kết quả qua email.',
										),
									);
								},
							}),
						]}
					>
						<Input
							type="email"
							placeholder="email@example.com"
							maxLength={255}
							autoComplete="email"
						/>
					</Form.Item>

					<PublicMockTestProfileFields
						options={profileOptions}
						optionsError={profileOptionsError}
						includeExpectedScore={false}
					/>

					<Divider className="!my-4" />

					<Form.Item
						name="resultDeliveryEmail"
						valuePropName="checked"
						className="!mb-3"
					>
						<Checkbox>
							Nhận kết quả qua email (cần xác nhận email sau khi hoàn thành bài
							thi)
						</Checkbox>
					</Form.Item>

					<Form.Item
						name="consentMarketing"
						valuePropName="checked"
						className="!mb-4"
						rules={[
							{
								validator: (_, v) =>
									v
										? Promise.resolve()
										: Promise.reject(
												new Error(
													'Vui lòng đồng ý điều khoản nhận thông tin.',
												),
											),
							},
						]}
					>
						<Checkbox>
							Tôi đồng ý nhận thông tin tư vấn và ưu đãi từ Ebest.
						</Checkbox>
					</Form.Item>

					<Form.Item className="!mb-0">
						<Space direction="vertical" className="w-full" size="small">
							<Button
								type="primary"
								htmlType="submit"
								size="large"
								block
								loading={submitting}
							>
								Tiếp tục — chọn bài thi
							</Button>
							<Text type="secondary" className="text-xs block text-center">
								Bước tiếp theo: chọn bài thi, xác minh Zalo và làm bài.
							</Text>
						</Space>
					</Form.Item>
				</Form>
			)}
		</MockTestOnlineFunnelShell>
	);
}
