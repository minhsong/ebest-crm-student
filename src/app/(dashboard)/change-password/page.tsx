'use client';

import { useCallback, useState } from 'react';
import { Form, Input, Button, Alert, App } from 'antd';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader, PageCard } from '@/components/layout';

export default function ChangePasswordPage() {
  const { fetchWithAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { message: antMessage } = App.useApp();
  const [form] = Form.useForm();

  const onFinish = useCallback(
    async (values: { currentPassword: string; newPassword: string }) => {
      setLoading(true);
      setError(null);
      setSuccess(false);
      try {
        const res = await fetchWithAuth('/api/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data?.message ?? 'Đổi mật khẩu thất bại.');
          return;
        }
        setSuccess(true);
        antMessage.success('Đã đổi mật khẩu thành công.');
        form.resetFields();
      } finally {
        setLoading(false);
      }
    },
    [fetchWithAuth, antMessage, form]
  );

  return (
    <>
      <PageHeader title="Đổi mật khẩu" description="Cập nhật mật khẩu đăng nhập của bạn." />
      <PageCard className="max-w-md">
        {error && (
          <Alert type="error" message={error} className="mb-4" showIcon />
        )}
        {success && (
          <Alert type="success" message="Mật khẩu đã được cập nhật." className="mb-4" showIcon />
        )}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </PageCard>
    </>
  );
}
