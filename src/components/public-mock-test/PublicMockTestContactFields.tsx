'use client';

import { Alert, Button, Form, Input } from 'antd';
import { PhoneInputField } from '@/components/phone-input';
import { publicMockTestFormRules } from '@/lib/public-mock-test/validation';

interface Props {
	submitting?: boolean;
	showSubmit?: boolean;
}

export function PublicMockTestContactFields({
	submitting = false,
	showSubmit = true,
}: Props) {
	return (
		<>
			<Form.Item
				name="displayName"
				label="Họ và tên"
				rules={publicMockTestFormRules.displayName}
				validateTrigger={['onBlur', 'onChange']}
			>
				<Input placeholder="Nguyễn Văn A" maxLength={255} autoComplete="name" />
			</Form.Item>

			<Form.Item
				name="primaryPhone"
				label="Số điện thoại"
				rules={publicMockTestFormRules.primaryPhone}
				validateTrigger={['onBlur', 'onChange']}
				getValueFromEvent={(v: string | undefined) => v}
			>
				<PhoneInputField placeholder="Số điện thoại (VD: 090…)" />
			</Form.Item>

			<Form.Item
				name="primaryEmail"
				label="Email"
				rules={publicMockTestFormRules.primaryEmail}
				validateTrigger={['onBlur', 'onChange']}
				normalize={(v) => (typeof v === 'string' ? v.trim() : v)}
			>
				<Input
					type="email"
					placeholder="email@example.com"
					maxLength={255}
					autoComplete="email"
				/>
			</Form.Item>

			<Alert
				type="info"
				showIcon
				className="!mb-4"
				message="SĐT và email bắt buộc để xác nhận đăng ký và báo điểm sau khi thi."
			/>

			{showSubmit ? (
				<Button type="primary" htmlType="submit" loading={submitting} block size="large">
					Gửi đăng ký
				</Button>
			) : null}
		</>
	);
}
