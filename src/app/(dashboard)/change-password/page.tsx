'use client';

import { useCallback } from 'react';
import { Form, Input, Button, Alert, App } from 'antd';
import { PageHeader, PageCard } from '@/components/layout';
import { useChangePassword } from '@/hooks/use-change-password';

export default function ChangePasswordPage() {
  const { message: antMessage } = App.useApp();
  const [form] = Form.useForm();
  const { loading, error, done, submit, reset } = useChangePassword({
    endpoint: '/api/auth/change-password',
  });

  const onFinish = useCallback(
    async (values: { currentPassword: string; newPassword: string }) => {
      const result = await submit(values.currentPassword, values.newPassword);
      if (result.ok) {
        antMessage.success(result.message ?? 'Đã đổi mật khẩu thành công.');
        form.resetFields();
      }
    },
    [submit, antMessage, form],
  );

  return (
    <>
      <PageHeader title="Đổi mật khẩu" description="Cập nhật mật khẩu đăng nhập của bạn." />
      <PageCard className="max-w-md">
        {error ? <Alert type="error" message={error} className="mb-4" showIcon /> : null}
        {done ? (
          <Alert type="success" message="Mật khẩu đã được cập nhật." className="mb-4" showIcon />
        ) : null}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={() => reset()}
        >
          <Form.Item
            name="currentPassword"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 6, message: 'Ít nhất 6 ký tự' },
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu mới"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu' },
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
            <Input.Password autoComplete="new-password" />
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
