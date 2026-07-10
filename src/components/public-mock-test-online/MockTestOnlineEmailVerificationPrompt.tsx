'use client';

import { useCallback, useState } from 'react';
import { Alert, Button, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import {
	emailVerificationHintFromResult,
	requestMockTestOnlineEmailVerification,
} from '@/lib/public-mock-test-online/email-verification-client';

const { Text } = Typography;

type Props = {
	registrationId: number | null | undefined;
};

/** Gửi lại email xác nhận K2 sau khi nộp bài (nếu đã chọn nhận kết quả qua email). */
export function MockTestOnlineEmailVerificationPrompt({ registrationId }: Props) {
	const [sending, setSending] = useState(false);
	const [hint, setHint] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);

	const onResend = useCallback(async () => {
		if (!registrationId || registrationId < 1) return;
		setSending(true);
		setError(null);
		try {
			const result = await requestMockTestOnlineEmailVerification(registrationId);
			setHint(emailVerificationHintFromResult(result));
		} catch (e) {
			setError(e instanceof Error ? e.message : 'Không gửi được email xác nhận.');
		} finally {
			setSending(false);
		}
	}, [registrationId]);

	if (!registrationId || registrationId < 1) return null;

	return (
		<Alert
			type="info"
			showIcon
			icon={<MailOutlined />}
			className="!mt-4"
			message="Nhận kết quả qua email"
			description={
				<>
					<Text className="block !mb-2">
						Nếu bạn đã chọn nhận kết quả qua email khi đăng ký, hãy xác nhận email
						để hệ thống gửi điểm và hướng dẫn sau khi chấm xong.
					</Text>
					{hint ? (
						<Text type="secondary" className="block !mb-2 text-sm">
							{hint}
						</Text>
					) : null}
					{error ? (
						<Text type="danger" className="block !mb-2 text-sm">
							{error}
						</Text>
					) : null}
					<Button size="small" loading={sending} onClick={() => void onResend()}>
						Gửi email xác nhận
					</Button>
				</>
			}
		/>
	);
}
