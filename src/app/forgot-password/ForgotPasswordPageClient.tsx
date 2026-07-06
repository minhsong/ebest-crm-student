'use client';

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Input, Button, Alert, App } from 'antd';
import Link from 'next/link';
import { MailOutlined, UserOutlined } from '@ant-design/icons';
import { useForgotPassword } from '@/hooks/use-password-recovery';
import { useRedirectIfLoggedIn } from '@/hooks/use-redirect-if-logged-in';
import { AuthWideFormLayout } from '@/components/auth/AuthWideFormLayout';
import { FANPAGE_URL } from '@/lib/ui-constants';
import {
  PortalLoginModePicker,
  parsePortalLoginModeFromQuery,
  type PortalLoginMode,
} from '@/components/portal/PortalLoginModePicker';

const CUSTOMER_SIDEBAR = [
  'Chỉ email đã có tài khoản đăng nhập trên hệ thống mới nhận được link đặt lại mật khẩu.',
  'Nếu hệ thống báo chưa có tài khoản, có thể bạn chưa hoàn tất đăng ký — vui lòng liên hệ Fanpage để được hỗ trợ.',
  'Kiểm tra cả thư mục Spam / Quảng cáo nếu không thấy email trong hộp thư đến.',
  <>Cần hỗ trợ? <a href={FANPAGE_URL} target="_blank" rel="noopener noreferrer">Fanpage E-best English</a>.</>,
];

const LEAD_SIDEBAR = [
  'Nhập email hoặc SĐT đã dùng khi đăng ký thi thử online.',
  'Hệ thống gửi link đặt lại mật khẩu tới email đã xác nhận trên tài khoản thí sinh.',
  'Nếu chưa xác nhận email, vui lòng kiểm tra hộp thư sau khi đăng ký hoặc liên hệ Ebest.',
  <>Cần hỗ trợ? <a href={FANPAGE_URL} target="_blank" rel="noopener noreferrer">Fanpage E-best English</a>.</>,
];

export default function ForgotPasswordPageClient() {
  const searchParams = useSearchParams();
  const { message: antMessage } = App.useApp();
  const { shouldHide } = useRedirectIfLoggedIn();
  const [mode, setMode] = useState<PortalLoginMode>('customer');
  const { loading, error, submit, setError } = useForgotPassword(mode);

  useEffect(() => {
    setMode(parsePortalLoginModeFromQuery(searchParams.get('mode')));
  }, [searchParams]);

  const onFinishCustomer = useCallback(
    async (values: { email: string }) => {
      const result = await submit(values.email);
      if (result.ok && result.message) {
        antMessage.success(result.message);
      }
    },
    [submit, antMessage],
  );

  const onFinishLead = useCallback(
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

  const sidebar = mode === 'lead' ? LEAD_SIDEBAR : CUSTOMER_SIDEBAR;

  return (
    <AuthWideFormLayout
      title="Quên mật khẩu"
      sidebar={
        <div className="rounded-lg bg-slate-50 p-4 md:p-5">
          <h3 className="mb-3 text-sm font-semibold text-gray-800">Lưu ý</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
            {sidebar.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      }
    >
      <div className="flex flex-col md:max-w-md">
        <PortalLoginModePicker
          className="mb-4"
          value={mode}
          onChange={(next) => {
            setMode(next);
            setError(null);
          }}
        />

        {mode === 'customer' ? (
          <>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              Nhập <strong>email đã dùng để đăng nhập</strong> cổng học viên.
            </p>
            <Form layout="vertical" onFinish={onFinishCustomer} size="large">
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
              {error ? (
                <Alert type="error" message={error} className="mb-4" showIcon />
              ) : null}
              <Form.Item className="mb-2">
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Gửi link đặt lại mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm leading-relaxed text-gray-600">
              Nhập <strong>email hoặc SĐT</strong> đã đăng ký thi thử online.
            </p>
            <Form layout="vertical" onFinish={onFinishLead} size="large">
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
                />
              </Form.Item>
              {error ? (
                <Alert type="error" message={error} className="mb-4" showIcon />
              ) : null}
              <Form.Item className="mb-2">
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Gửi link đặt lại mật khẩu
                </Button>
              </Form.Item>
            </Form>
          </>
        )}

        <p className="mb-0 text-center text-sm">
          <Link
            href={mode === 'lead' ? '/login?mode=lead' : '/login'}
            className="text-blue-600 hover:underline"
          >
            ← Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </AuthWideFormLayout>
  );
}
