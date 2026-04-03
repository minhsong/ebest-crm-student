'use client';

import { useCallback } from 'react';
import { Form, Input, Button, Alert, App } from 'antd';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MailOutlined } from '@ant-design/icons';
import { useForgotPassword } from '@/hooks/use-password-recovery';
import { useRedirectIfLoggedIn } from '@/hooks/use-redirect-if-logged-in';
import { AuthWideFormLayout } from '@/components/auth/AuthWideFormLayout';
import { FANPAGE_URL } from '@/lib/ui-constants';

const SIDEBAR_ITEMS = [
  'Chỉ email đã có tài khoản đăng nhập trên hệ thống mới nhận được link đặt lại mật khẩu.',
  'Nếu hệ thống báo chưa có tài khoản, có thể bạn chưa hoàn tất đăng ký — vui lòng liên hệ Fanpage để được hỗ trợ.',
  'Kiểm tra cả thư mục Spam / Quảng cáo nếu không thấy email trong hộp thư đến.',
  <>Cần hỗ trợ? <a href={FANPAGE_URL} target="_blank" rel="noopener noreferrer">Fanpage E-best English</a>.</>,
];

/**
 * Quên mật khẩu — form + proxy CRM; UI đồng bộ trang đăng nhập.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const { message: antMessage } = App.useApp();
  const { shouldHide } = useRedirectIfLoggedIn();
  const { loading, error, submit } = useForgotPassword();

  const onFinish = useCallback(
    async (values: { email: string }) => {
      const result = await submit(values.email);
      if (result.ok && result.message) {
        antMessage.success(result.message);
        router.push('/login');
      }
    },
    [submit, antMessage, router],
  );

  if (shouldHide) {
    return null;
  }

  return (
    <AuthWideFormLayout
      title="Quên mật khẩu"
      sidebar={
        <div className="rounded-lg bg-slate-50 p-4 md:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Lưu ý</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
            {SIDEBAR_ITEMS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="flex flex-col md:max-w-md">
        <p className="mb-4 text-sm leading-relaxed text-gray-600">
          Nhập <strong>email đã dùng để đăng nhập</strong> (đã hoàn tất đăng ký
          trên hệ thống). Nếu email chưa có tài khoản, bạn sẽ thấy hướng dẫn liên
          hệ Fanpage. Đăng nhập bằng số điện thoại thì vui lòng liên hệ trung
          tâm.
        </p>
        <Form layout="vertical" onFinish={onFinish} size="large">
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="email@example.com"
              autoComplete="email"
            />
          </Form.Item>
          {error && (
            <Alert type="error" message={error} className="mb-4" showIcon />
          )}
          <Form.Item className="mb-2">
            <Button type="primary" htmlType="submit" loading={loading} block>
              Gửi link đặt lại mật khẩu
            </Button>
          </Form.Item>
          <p className="mb-0 text-center text-sm">
            <Link href="/login" className="text-blue-600 hover:underline">
              ← Quay lại đăng nhập
            </Link>
          </p>
        </Form>
      </div>
    </AuthWideFormLayout>
  );
}
