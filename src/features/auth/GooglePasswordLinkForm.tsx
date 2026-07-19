'use client';

import { Button, Form, Input } from 'antd';

type Props = {
  description: string;
  loading: boolean;
  onSubmit: (password: string) => Promise<void>;
  onCancel: () => void;
  variant?: 'default' | 'on-brand';
};

/** Form dùng chung cho password challenge khi link Google Lead/Customer. */
export function GooglePasswordLinkForm({
  description,
  loading,
  onSubmit,
  onCancel,
  variant = 'default',
}: Props) {
  return (
    <div
      className={
        variant === 'on-brand'
          ? 'rounded-lg border border-white/30 bg-white/10 p-3 text-left'
          : ''
      }
    >
      <p
        className={`mb-2 text-sm ${
          variant === 'on-brand' ? 'text-white/90' : 'text-gray-600'
        }`}
      >
        {description}
      </p>
      <Form
        layout="vertical"
        requiredMark={false}
        onFinish={(values: { password: string }) =>
          void onSubmit(values.password)
        }
      >
        <Form.Item
          name="password"
          rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}
          className="mb-2"
        >
          <Input.Password
            placeholder="Mật khẩu tài khoản hiện có"
            autoComplete="current-password"
            size="large"
          />
        </Form.Item>
        <div className="flex gap-2">
          <Button
            htmlType="submit"
            loading={loading}
            type="primary"
            className="flex-1"
          >
            Xác nhận và đăng nhập
          </Button>
          <Button onClick={onCancel} disabled={loading}>
            Hủy
          </Button>
        </div>
      </Form>
    </div>
  );
}
