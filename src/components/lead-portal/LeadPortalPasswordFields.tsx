'use client';

import { Form, Input } from 'antd';
import type { ReactNode } from 'react';
import { portalNewPasswordRules } from '@/lib/portal-auth/password-policy';

type Props = {
	/** Label field mật khẩu (mặc định «Tạo mật khẩu đăng nhập»). */
	passwordLabel?: string;
	extra?: ReactNode;
	/** Tên field confirm — mặc định confirmPassword. */
	confirmName?: string;
};

/**
 * SSOT password + confirm cho Lead complete-profile / create-account.
 * Dùng chung rules `portalNewPasswordRules`.
 */
export function LeadPortalPasswordFields({
	passwordLabel = 'Tạo mật khẩu đăng nhập',
	extra,
	confirmName = 'confirmPassword',
}: Props) {
	return (
		<>
			<Form.Item
				name="password"
				label={passwordLabel}
				extra={extra}
				rules={portalNewPasswordRules}
			>
				<Input.Password autoComplete="new-password" />
			</Form.Item>
			<Form.Item
				name={confirmName}
				label="Nhập lại mật khẩu"
				dependencies={['password']}
				rules={[
					{
						required: true,
						message: 'Vui lòng nhập lại mật khẩu',
					},
					({ getFieldValue }) => ({
						validator(_, value) {
							return !value || getFieldValue('password') === value
								? Promise.resolve()
								: Promise.reject(new Error('Mật khẩu không khớp'));
						},
					}),
				]}
			>
				<Input.Password autoComplete="new-password" />
			</Form.Item>
		</>
	);
}
