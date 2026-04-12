'use client';

import { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, Card, Alert, Row, Col, App } from 'antd';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import { EbestLogo } from '@/components/branding/EbestLogo';
import { APP_BRAND, EBEST_BRAND_ORANGE, FANPAGE_URL } from '@/lib/ui-constants';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { parseStudentPortalGoogleFromPublic } from '@/lib/student-portal-google-settings';
import { LoginGoogleSection } from '@/features/auth/LoginGoogleSection';

/** Cam brand (~HSL 16° / ~78% sat / ~51% L) — đồng bộ nhận diện với logo. */
const LOGIN_BRAND_BG = '#e35321';

const GUIDE_ITEMS = [
  `Đây là cổng thông tin và hệ thống hỗ trợ quản lý chất lượng đào tạo dành riêng cho học viên ${APP_BRAND}.`,
  'Quyền sử dụng được trao cho học viên sau khi đã hoàn tất xác nhận thông tin và các bước đăng ký theo hướng dẫn của trung tâm.',
  `${APP_BRAND} tiếp nhận và quản lý thông tin học tập của bạn một cách bảo mật, nhằm nâng cao chất lượng giảng dạy, chăm sóc và đồng hành cùng học viên.`,
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
  const [sessionExpired, setSessionExpired] = useState(false);
  const [googleCfg, setGoogleCfg] = useState<{
    enabled: boolean;
    clientId: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    setSessionExpired(q.get('session') === 'expired');
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/settings/public')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (cancelled) return;
        const p =
          data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : {};
        const raw = (p.result ?? p.data ?? p) as Record<string, unknown>;
        setGoogleCfg(parseStudentPortalGoogleFromPublic(raw));
      })
      .catch(() => {
        if (!cancelled) setGoogleCfg({ enabled: false, clientId: '' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ready && accessToken) {
      router.replace('/');
    }
  }, [ready, accessToken, router]);

  const postLoginPath = useCallback(() => {
    if (typeof window === 'undefined') return '/';
    const q = new URLSearchParams(window.location.search);
    const raw = q.get('redirect');
    if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
    return '/';
  }, []);

  const onFinish = useCallback(
    async (values: { loginId: string; password: string }) => {
      setError(null);
      setLoading(true);
      try {
        const result = await login(values.loginId.trim(), values.password);
        if (result.ok) {
          antMessage.success('Đăng nhập thành công.');
          router.replace(postLoginPath());
        } else {
          setError(result.message ?? 'Đăng nhập thất bại.');
        }
      } finally {
        setLoading(false);
      }
    },
    [login, router, antMessage, postLoginPath]
  );

  if (ready && accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex justify-center">
          <EbestLogo variant="login-hero" priority />
        </div>

        <Card
          bordered={false}
          className="overflow-hidden rounded-xl shadow-lg ring-1 ring-black/10"
          styles={{ body: { padding: 0 } }}
        >
          <div style={{ backgroundColor: EBEST_BRAND_ORANGE }}>
            <Row gutter={[0, 0]}>
              {/* Desktop: trái = đăng nhập; mobile: dưới cùng (sau hướng dẫn) */}
              <Col xs={24} md={12} className="order-3 md:order-1">
                <div className="flex flex-col items-center px-4 pb-4 pt-4 md:items-start md:border-r md:border-white/25 md:px-5 md:py-4 md:pr-6">
                  <Form
                    layout="vertical"
                    onFinish={onFinish}
                    initialValues={{ loginId: '', password: '' }}
                    className="w-full max-w-sm [&_.ant-form-item]:mb-3 [&_.ant-form-item-label>label]:!text-sm [&_.ant-form-item-label>label]:!text-white [&_.ant-form-item-label>label]:!h-auto [&_.ant-form-item-required::before]:!text-amber-200"
                    size="large"
                  >
                    {sessionExpired && (
                      <Alert
                        type="info"
                        message="Phiên đăng nhập đã hết hạn hoặc không còn hợp lệ. Vui lòng đăng nhập lại."
                        className="mb-3 border-white/30 bg-white/10 text-white"
                        showIcon
                      />
                    )}
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
                    <div className="-mt-1 mb-2 text-right">
                      <Link
                        href="/forgot-password"
                        className="text-sm text-white/90 underline-offset-2 hover:text-white hover:underline"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    {error && (
                      <Alert
                        type="error"
                        message={error}
                        className="mb-3 border-red-400/40 bg-red-950/25 text-red-50"
                        showIcon
                      />
                    )}
                    <Form.Item className="mb-0">
                      <Button
                        htmlType="submit"
                        loading={loading}
                        block
                        size="large"
                        className="!h-10 !border-0 !bg-white !font-semibold !shadow-md hover:!bg-white/95 focus:!bg-white/95 active:!bg-white/90"
                        style={{ color: EBEST_BRAND_ORANGE }}
                      >
                        Đăng nhập
                      </Button>
                    </Form.Item>
                  </Form>

                  {googleCfg?.enabled && googleCfg.clientId ? (
                    <GoogleOAuthProvider
                      clientId={googleCfg.clientId}
                      locale="vi"
                    >
                      <div className="mt-1.5 flex w-full max-w-sm items-center gap-2">
                        <div
                          className="h-px min-w-0 flex-1 bg-white/25"
                          aria-hidden
                        />
                        <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.12em] text-white/55">
                          Hoặc
                        </span>
                        <div
                          className="h-px min-w-0 flex-1 bg-white/25"
                          aria-hidden
                        />
                      </div>
                      <LoginGoogleSection
                        className="mt-1.5"
                        noteClassName="!text-white/75"
                        onLoggedIn={() => router.replace(postLoginPath())}
                      />
                    </GoogleOAuthProvider>
                  ) : null}
                </div>
              </Col>

              {/* Desktop: phải = hướng dẫn; mobile: trên cùng — một viền ngăn với form */}
              <Col xs={24} md={12} className="order-1 md:order-2">
                <div className="border-b border-white/25 px-4 pb-4 pt-3 md:border-b-0 md:px-5 md:py-4 md:pl-6">
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    Thông tin dành cho học viên
                  </h3>
                  <ul className="list-outside space-y-2.5 pl-4 text-sm leading-relaxed text-white">
                    {GUIDE_ITEMS.map((item, i) => (
                      <li key={i} className="marker:text-white/50">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mb-0 mt-3 text-xs leading-relaxed text-white/90">
                    Mọi thắc mắc về tài khoản hoặc đăng nhập, vui lòng liên hệ
                    trực tiếp trung tâm {APP_BRAND} hoặc{' '}
                    <a
                      href={FANPAGE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white underline decoration-white/50 underline-offset-2 hover:text-white hover:decoration-white"
                    >
                      Fanpage chính thức
                    </a>
                    .
                  </p>
                </div>
              </Col>
            </Row>
          </div>
        </Card>
      </div>
    </div>
  );
}
