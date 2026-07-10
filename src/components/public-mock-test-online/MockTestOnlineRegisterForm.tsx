'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
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

const { Text, Title, Paragraph } = Typography;

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
	widgetTitle = 'Đăng ký thi thử TOEIC online miễn phí',
	widgetIntro = 'Điền thông tin liên hệ để bắt đầu. Sau bước này bạn sẽ chọn bài thi và xác minh qua Zalo.',
	attemptStatus = null,
	intakeBlocked = false,
}: MockTestOnlineRegisterFormProps) {
	const router = useRouter();
	const { message } = App.useApp();
	const [form] = Form.useForm<MockTestOnlineRegisterFormValues>();
	const [submitting, setSubmitting] = useState(false);
	const draftSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
			try {
				const recaptchaToken = await executeRecaptchaMockTestOnlineIntake();
				const profile = collectPublicProfilePayload(values);
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
						...profile,
					}),
				});
				const data = (await res.json()) as MockTestOnlineLeadIntakeResponse & {
					message?: string;
				};
				if (!res.ok) {
					throw new Error(data.message ?? 'Đăng ký thất bại.');
				}

				if (!data.pendingLeadId) {
					throw new Error('Không nhận được phản hồi. Vui lòng thử lại.');
				}

				message.success('Đăng ký thành công. Chọn bài thi tiếp theo nhé!');
				clearIntakeDraft();
				router.push(
					`/mock-test-online/select-exam?lead=${encodeURIComponent(data.pendingLeadId)}`,
				);
			} catch (e) {
				message.error(
					e instanceof Error ? e.message : 'Đăng ký thất bại. Thử lại sau.',
				);
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
				onValuesChange={(_, allValues) => scheduleDraftSave(allValues)}
				initialValues={{
					displayName: initialContact?.displayName ?? '',
					primaryPhone: initialContact?.primaryPhone ?? '',
					primaryEmail: initialContact?.primaryEmail ?? '',
					consentMarketing: false,
					resultDeliveryEmail: false,
				}}
			>
				<Text strong className="mock-test-section-title">
					Thông tin liên hệ
				</Text>
				<Form.Item
					name="displayName"
					label="Họ và tên"
					rules={publicMockTestFormRules.displayName}
				>
					<Input placeholder="Nguyễn Văn A" maxLength={255} autoComplete="name" />
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
									new Error('Vui lòng nhập email để nhận kết quả qua email.'),
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
				/>

				<Divider className="!my-4" />

				<Form.Item name="resultDeliveryEmail" valuePropName="checked" className="!mb-3">
					<Checkbox>
						Nhận kết quả qua email (cần xác nhận email sau khi hoàn thành bài thi)
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
											new Error('Vui lòng đồng ý điều khoản nhận thông tin.'),
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
