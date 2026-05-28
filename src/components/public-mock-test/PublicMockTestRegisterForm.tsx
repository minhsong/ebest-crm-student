'use client';

import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, App, Button, Divider, Empty, Form, Modal, Radio, Space, Typography } from 'antd';
import { executeRecaptchaV3 } from '@/lib/public-mock-test/recaptcha';
import type {
	PublicLocationGroup,
	PublicMergeRequiredResponse,
	PublicMockTestFormValues,
	PublicRegisterResponse,
	PublicRegistrationOptions,
} from '@/lib/public-mock-test/types';
import { collectPublicProfilePayload } from '@/lib/public-mock-test/profile-payload';
import { MERGE_CONFIRM_COPY } from '@/lib/public-mock-test/merge-confirm-copy';
import { PublicMockTestContactFields } from './PublicMockTestContactFields';
import { PublicMockTestProfileFields } from './PublicMockTestProfileFields';
import { PublicMockTestSessionPicker } from './PublicMockTestSessionPicker';

const { Text } = Typography;

export interface PublicMockTestRegisterFormProps {
	initialLocations: PublicLocationGroup[];
	initialProfileOptions: PublicRegistrationOptions | null;
	sessionsError?: string | null;
	profileOptionsError?: string | null;
	initialContact?: {
		displayName?: string;
		primaryPhone?: string;
		primaryEmail?: string;
	} | null;
}

export function PublicMockTestRegisterForm({
	initialLocations,
	initialProfileOptions,
	sessionsError = null,
	profileOptionsError = null,
	initialContact = null,
}: PublicMockTestRegisterFormProps) {
	const router = useRouter();
	const { message } = App.useApp();
	const [form] = Form.useForm<PublicMockTestFormValues>();
	const [submitting, setSubmitting] = useState(false);
	const [success, setSuccess] = useState<PublicRegisterResponse | null>(null);
	const [mergePending, setMergePending] = useState<PublicMergeRequiredResponse | null>(null);
	const [mergeChoice, setMergeChoice] = useState<string>('standalone');
	const locations = initialLocations;
	const selectedLocationKey = Form.useWatch('locationKey', form);
	const selectedSessionId = Form.useWatch('sessionId', form);

	const onLocationChange = useCallback(() => {
		form.setFieldValue('sessionId', undefined);
	}, [form]);

	const onFinish = useCallback(
		async (values: PublicMockTestFormValues) => {
			setSubmitting(true);
			try {
				const recaptchaToken = await executeRecaptchaV3();
				const profile = collectPublicProfilePayload(values);
				const res = await fetch('/api/public/mock-test/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						sessionId: values.sessionId,
						displayName: values.displayName.trim(),
						primaryPhone: values.primaryPhone?.trim(),
						primaryEmail: values.primaryEmail.trim(),
						recaptchaToken,
						...profile,
					}),
				});
				const data = (await res.json()) as
					| PublicRegisterResponse
					| PublicMergeRequiredResponse
					| { message?: string };
				if (!res.ok) {
					throw new Error((data as { message?: string }).message ?? 'Đăng ký thất bại');
				}
				if ((data as PublicMergeRequiredResponse).status === 'merge_required') {
					setMergePending(data as PublicMergeRequiredResponse);
					setMergeChoice('standalone');
					message.info(MERGE_CONFIRM_COPY.toastHint);
					return;
				}
				setSuccess(data as PublicRegisterResponse);
				message.success((data as PublicRegisterResponse).message);
			} catch (e) {
				message.error(e instanceof Error ? e.message : 'Đăng ký thất bại');
			} finally {
				setSubmitting(false);
			}
		},
		[message],
	);

	const submitMergeDecision = useCallback(async () => {
		if (!mergePending) return;
		setSubmitting(true);
		try {
			const decision =
				mergeChoice === 'standalone'
					? { mode: 'standalone' }
					: { mode: 'candidate', candidateKey: mergeChoice };
			const res = await fetch('/api/public/mock-test/register/complete', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mergeToken: mergePending.mergeToken, decision }),
			});
			const data = (await res.json()) as PublicRegisterResponse & { message?: string };
			if (!res.ok) {
				throw new Error(data.message ?? MERGE_CONFIRM_COPY.completeError);
			}
			setMergePending(null);
			setSuccess(data);
			message.success(data.message);
		} catch (e) {
			message.error(e instanceof Error ? e.message : MERGE_CONFIRM_COPY.completeError);
		} finally {
			setSubmitting(false);
		}
	}, [mergeChoice, mergePending, message]);

	const candidateList = useMemo(() => {
		return mergePending?.preview.candidates ?? [];
	}, [mergePending]);

	if (success) {
		return (
			<div className="ebest-mock-test-widget">
				<Alert type="success" showIcon message={success.message} />
				<Text type="secondary" className="mt-2 block text-sm">
					Mã đăng ký #{success.registrationId}
				</Text>
				<Button type="link" className="!px-0 mt-2" onClick={() => setSuccess(null)}>
					Đăng ký thêm buổi khác
				</Button>
			</div>
		);
	}
	if (sessionsError && locations.length === 0) {
		return (
			<div className="ebest-mock-test-widget">
				<Alert
					type="error"
					showIcon
					message={sessionsError}
					action={
						<Button size="small" onClick={() => router.refresh()}>
							Thử lại
						</Button>
					}
				/>
			</div>
		);
	}
	if (!locations.length) {
		return (
			<div className="ebest-mock-test-widget">
				<Empty description="Hiện chưa có buổi thi mở đăng ký." />
			</div>
		);
	}

	return (
		<div className="ebest-mock-test-widget">
			{sessionsError ? <Alert type="warning" showIcon message={sessionsError} className="!mb-4" /> : null}
			<Form
				form={form}
				initialValues={{
					displayName: initialContact?.displayName,
					primaryPhone: initialContact?.primaryPhone,
					primaryEmail: initialContact?.primaryEmail,
				}}
				layout="vertical"
				onFinish={onFinish}
				requiredMark="optional"
				validateTrigger="onBlur"
				size="middle"
			>
				<PublicMockTestSessionPicker
					locations={locations}
					selectedLocationKey={selectedLocationKey}
					onLocationChange={onLocationChange}
				/>
				{selectedSessionId ? (
					<>
						<PublicMockTestContactFields submitting={submitting} showSubmit={false} />
						<PublicMockTestProfileFields
							options={initialProfileOptions}
							optionsError={profileOptionsError}
						/>
						<Button type="primary" htmlType="submit" loading={submitting} block size="large">
							Gửi đăng ký
						</Button>
					</>
				) : (
					<Text type="secondary" className="text-sm">
						Chọn cơ sở và lịch thi để tiếp tục nhập thông tin liên hệ.
					</Text>
				)}
			</Form>
			<Modal
				open={!!mergePending}
				maskClosable={false}
				closable={false}
				title={MERGE_CONFIRM_COPY.modalTitle}
				okText={MERGE_CONFIRM_COPY.okText}
				cancelText={MERGE_CONFIRM_COPY.cancelText}
				confirmLoading={submitting}
				onOk={submitMergeDecision}
				onCancel={() => setMergePending(null)}
			>
				<Space direction="vertical" size={12} className="w-full">
					<Text className="block">{MERGE_CONFIRM_COPY.intro}</Text>
					<Text className="block">{MERGE_CONFIRM_COPY.instructionConfirm}</Text>
					<div>
						<Text strong>{MERGE_CONFIRM_COPY.yourInfoLabel}</Text>
						<div className="text-sm mt-1 mock-test-merge-your-info">
							<div>{mergePending?.preview.incoming.displayName}</div>
							<div>{mergePending?.preview.incoming.primaryPhone}</div>
							<div>{mergePending?.preview.incoming.primaryEmail}</div>
						</div>
					</div>
					{candidateList.length > 0 ? (
						<Text strong className="block">
							{MERGE_CONFIRM_COPY.similarListLabel}
						</Text>
					) : null}
					<Radio.Group
						value={mergeChoice}
						onChange={(e) => setMergeChoice(e.target.value)}
						className="w-full"
					>
						<Space direction="vertical" className="w-full">
							{candidateList.map((candidate) => (
								<Radio key={candidate.key} value={candidate.key} className="!items-start">
									<Space direction="vertical" size={0}>
										<Text>{candidate.displayName}</Text>
										<Text type="secondary" className="text-xs">
											{candidate.primaryPhoneMasked || 'Không có SĐT'} •{' '}
											{candidate.primaryEmailMasked || 'Không có email'}
										</Text>
									</Space>
								</Radio>
							))}
							<Divider className="!my-1" />
							<Text type="secondary" className="block text-sm !mb-1">
								{MERGE_CONFIRM_COPY.instructionSkip}
							</Text>
							<Radio value="standalone" className="!items-start">
								{MERGE_CONFIRM_COPY.notMeOption}
							</Radio>
						</Space>
					</Radio.Group>
				</Space>
			</Modal>
		</div>
	);
}
