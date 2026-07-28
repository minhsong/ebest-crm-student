'use client';

import { useCallback } from 'react';
import { Form, Input, Button, Alert, App, Typography } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useForgotPassword } from '@/hooks/use-password-recovery';
import { useRedirectIfLoggedIn } from '@/hooks/use-redirect-if-logged-in';
import { AuthWideFormLayout } from '@/components/auth/AuthWideFormLayout';
import { FanpageContactLink } from '@/components/portal-contact/FanpageContactLink';

const { Paragraph, Text } = Typography;

const SIDEBAR = [
  'Nhập email hoặc SĐT đã dùng để đăng nhập cổng học viên / thi thử online.',
  'Hệ thống gửi link đặt lại mật khẩu tới email đã xác nhận trên tài khoản.',
  'Nếu chưa có tài khoản hoặc chưa xác nhận email, vui lòng liên hệ Fanpage để được hỗ trợ.',
  'Kiểm tra cả thư mục Spam / Quảng cáo nếu không thấy email.',
  <>
    Cần hỗ trợ? <FanpageContactLink label="Fanpage E-best English" />.
  </>,
];

export default function ForgotPasswordPageClient() {
  const { message: antMessage } = App.useApp();
  const { shouldHide } = useRedirectIfLoggedIn();
  const { loading, error, submit } = useForgotPassword();

  const onFinish = useCallback(
    async (values: { loginId: string }) => {
      const result = await submit(values.loginId);
      if (result.ok && result.message) {
        antMessage.success(result.message);
      }
    },
    [submit, antMessage],
  );

  if (shouldHide) {
    return null;
  }

  return (
    <AuthWideFormLayout
      title="Quên mật khẩu"
      sidebar={
        <div className="rounded-lg bg-slate-50 p-4 md:p-5">
          <Text strong className="mb-3 block text-sm text-gray-800">
            Lưu ý
          </Text>
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
            {SIDEBAR.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      }
    >
      <Paragraph type="secondary" className="!mb-4">
        Nhập <Text strong>email hoặc SĐT</Text> đã dùng để đăng nhập.
      </Paragraph>
      <Form layout="vertical" onFinish={onFinish} size="large">
        <Form.Item
          name="loginId"
          label="Email hoặc số điện thoại"
          rules={[
            { required: true, message: 'Vui lòng nhập email hoặc SĐT' },
          ]}
        >
          <Input
            prefix={<UserOutlined className="text-gray-400" />}
            placeholder="Email hoặc SĐT"
            autoComplete="username"
          />
        </Form.Item>
        {error ? (
          <Alert type="error" message={error} className="mb-4" showIcon />
        ) : null}
        <Form.Item className="!mb-0">
          <Button type="primary" htmlType="submit" loading={loading} block>
            Gửi link đặt lại mật khẩu
          </Button>
        </Form.Item>
      </Form>
    </AuthWideFormLayout>
  );
}
