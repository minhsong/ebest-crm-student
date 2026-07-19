'use client';

import { Suspense, useCallback } from 'react';
import { Form, Input, Button, Alert, App } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { LockOutlined } from '@ant-design/icons';
import { useResetPassword } from '@/hooks/use-password-recovery';
import { useRedirectIfLoggedIn } from '@/hooks/use-redirect-if-logged-in';
import { AuthWideFormLayout } from '@/components/auth/AuthWideFormLayout';
import { FanpageContactLink } from '@/components/portal-contact/FanpageContactLink';
import { parsePortalLoginModeFromQuery } from '@/components/portal/PortalLoginModePicker';
import { portalNewPasswordRules } from '@/lib/portal-auth/password-policy';

const SIDEBAR_ITEMS = [
  'Liên kết trong email thường có hiệu lực trong 24 giờ.',
  'Sau khi đặt lại thành công, hãy đăng nhập bằng mật khẩu mới.',
  <>
    Không mở được link? <FanpageContactLink label="Liên hệ hỗ trợ" />.
  </>,
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const mode = parsePortalLoginModeFromQuery(searchParams.get('mode'));
  const { message: antMessage } = App.useApp();
  const { shouldHide } = useRedirectIfLoggedIn();
  const { loading, error, submit } = useResetPassword(mode);

  const onFinish = useCallback(
    async (values: { password: string; confirm: string }) => {
      if (!token) return;
      const result = await submit(token, values.password);
      if (result.ok && result.message) {
        antMessage.success(result.message);
        router.push(mode === 'lead' ? '/login?mode=lead' : '/login');
      }
    },
    [submit, antMessage, router, token, mode],
  );

  if (shouldHide) {
    return null;
  }

  const missingToken = !token;
  const loginHref = mode === 'lead' ? '/login?mode=lead' : '/login';
  const forgotHref =
    mode === 'lead' ? '/forgot-password?mode=lead' : '/forgot-password';

  return (
    <AuthWideFormLayout
      title="Đặt lại mật khẩu"
      sidebar={
        <div className="rounded-lg bg-slate-50 p-4 md:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Hướng dẫn</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
            {SIDEBAR_ITEMS.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="flex flex-col md:max-w-md">
        {missingToken ? (
          <Alert
            type="warning"
            showIcon
            message="Thiếu liên kết hợp lệ"
            description={
              <>
                Mở trang này từ nút trong email hoặc{' '}
                <Link href={forgotHref} className="text-blue-600">
                  yêu cầu gửi lại
                </Link>
                .
              </>
            }
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-gray-600">
              {mode === 'lead'
                ? 'Chọn mật khẩu mới cho tài khoản thí sinh thi thử online.'
                : 'Chọn mật khẩu mới cho tài khoản cổng học viên của bạn.'}
            </p>
            <Form layout="vertical" onFinish={onFinish} size="large">
              <Form.Item
                name="password"
                label="Mật khẩu mới"
                rules={portalNewPasswordRules}
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Mật khẩu mới"
                  autoComplete="new-password"
                />
              </Form.Item>
              <Form.Item
                name="confirm"
                label="Nhập lại mật khẩu"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng nhập lại mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Mật khẩu không khớp'));
                    },
                  }),
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                />
              </Form.Item>
              {error ? (
                <Alert type="error" message={error} className="mb-4" showIcon />
              ) : null}
              <Form.Item className="mb-2">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                >
                  Xác nhận mật khẩu mới
                </Button>
              </Form.Item>
              <p className="mb-0 text-center text-sm">
                <Link href={loginHref} className="text-blue-600 hover:underline">
                  ← Đăng nhập
                </Link>
              </p>
            </Form>
          </>
        )}
      </div>
    </AuthWideFormLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-gray-100 text-gray-500">
          Đang tải…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
