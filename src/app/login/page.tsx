'use client';

import { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, Card, Alert, Row, Col, Divider, App } from 'antd';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import { APP_BRAND, APP_NAME, FANPAGE_URL } from '@/lib/ui-constants';

const GUIDE_ITEMS = [
  'Sử dụng link từ trung tâm (complete-profile?token=...) để hoàn thiện thông tin lần đầu.',
  'Sau khi điền thông tin và đặt mật khẩu, bạn có thể đăng nhập tại đây.',
  <>Chưa nhận được link? Liên hệ <a href={FANPAGE_URL} target="_blank" rel="noopener noreferrer">Fanpage E-best English</a> để được hỗ trợ.</>,
];

/**
 * Trang đăng nhập – UI riêng cho khách (không dùng layout dashboard).
 * Đã đăng nhập thì chuyển về / (dashboard).
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, accessToken, ready } = useAuth();
  const { message: antMessage } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && accessToken) {
      router.replace('/');
    }
  }, [ready, accessToken, router]);

  const onFinish = useCallback(
    async (values: { loginId: string; password: string }) => {
      setError(null);
      setLoading(true);
      try {
        const result = await login(values.loginId.trim(), values.password);
        if (result.ok) {
          antMessage.success('Đăng nhập thành công.');
          router.replace('/');
        } else {
          setError(result.message ?? 'Đăng nhập thất bại.');
        }
      } finally {
        setLoading(false);
      }
    },
    [login, router, antMessage]
  );

  if (ready && accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 mt-0 text-center text-2xl font-semibold text-gray-800">
          Chào mừng đến với
        </h1>
        <h2 className="mb-8 mt-0 text-center text-xl font-medium text-blue-600">
          {APP_BRAND} {APP_NAME}
        </h2>

        <Card className="overflow-hidden shadow-md" bordered={false}>
          <Row gutter={[32, 24]}>
            <Col xs={24} md={12} className="order-2 md:order-1">
              <div className="flex flex-col items-center md:items-start">
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <UserOutlined className="text-xl" />
                  </div>
                  <div>
                    <span className="text-base font-semibold text-gray-800">
                      Đăng nhập
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      Cổng học viên
                    </span>
                  </div>
                </div>
                <Form
                  layout="vertical"
                  onFinish={onFinish}
                  initialValues={{ loginId: '', password: '' }}
                  className="w-full max-w-sm"
                  size="large"
                >
                  <Form.Item
                    name="loginId"
                    label="Email hoặc số điện thoại"
                    rules={[
                      {
                        required: true,
                        message: 'Vui lòng nhập email hoặc SĐT',
                      },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined className="text-gray-400" />}
                      placeholder="Email hoặc SĐT"
                    />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: 'Vui lòng nhập mật khẩu' },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="text-gray-400" />}
                      placeholder="Mật khẩu"
                    />
                  </Form.Item>
                  <div className="-mt-2 mb-4 text-right">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>
                  {error && (
                    <Alert
                      type="error"
                      message={error}
                      className="mb-4"
                      showIcon
                    />
                  )}
                  <Form.Item className="mb-2">
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      size="large"
                    >
                      Đăng nhập
                    </Button>
                  </Form.Item>
                  <p className="mb-0 text-center text-xs text-gray-500">
                    Chưa có tài khoản?{' '}
                    <Link
                      href="/complete-profile"
                      className="text-blue-600 hover:underline"
                    >
                      Dùng link từ trung tâm
                    </Link>{' '}
                    để tạo tài khoản.
                  </p>
                </Form>
              </div>
            </Col>

            <Col xs={24} md={0}>
              <Divider className="my-4" />
            </Col>

            <Col xs={24} md={12} className="order-1 md:order-2">
              <div className="rounded-lg bg-slate-50 p-4 md:p-5">
                <h3 className="mb-3 text-sm font-semibold text-gray-800">
                  Hướng dẫn
                </h3>
                <ul className="list-inside list-disc space-y-2 text-sm text-gray-600">
                  {GUIDE_ITEMS.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
                <Divider className="my-4" />
                <p className="mb-0 text-xs text-gray-500">
                  Nếu bạn gặp khó khăn khi đăng nhập hoặc chưa nhận được link
                  hoàn thiện thông tin, vui lòng liên hệ trung tâm {APP_BRAND}{' '}
                  hoặc{' '}
                  <a href={FANPAGE_URL} target="_blank" rel="noopener noreferrer">
                    Fanpage E-best English
                  </a>
                  .
                </p>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
}
