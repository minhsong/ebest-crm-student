'use client';

import { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, Card, Alert, Row, Col, App } from 'antd';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/contexts/auth-context';
import { EbestLogo } from '@/components/branding/EbestLogo';
import { APP_BRAND, EBEST_BRAND_ORANGE } from '@/lib/ui-constants';
import { FanpageContactLink } from '@/components/portal-contact/FanpageContactLink';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { parseStudentPortalGoogleFromPublic } from '@/lib/student-portal-google-settings';
import { fetchPublicPortalSettings } from '@/lib/public-settings-client';
import { LoginGoogleSection } from '@/features/auth/LoginGoogleSection';
import { usePortalSession } from '@/contexts/portal-session-context';
import {
  fetchLeadProfile,
  leadResendEmailVerification,
} from '@/lib/lead-portal/client-api';
import {
  homePathForPortalActor,
  postLoginPathForPortalActor,
} from '@/lib/portal-auth/portal-session-nav';
import { resolvePostLeadLoginPath } from '@/lib/portal-auth/session-routes';
import type { PortalLoginMode } from '@/components/portal/PortalLoginModePicker';
import { PortalLoginModePicker, parsePortalLoginModeFromQuery } from '@/components/portal/PortalLoginModePicker';

/** Cam brand (~HSL 16° / ~78% sat / ~51% L) — đồng bộ nhận diện với logo. */
const LOGIN_BRAND_BG = '#e35321';

const GUIDE_ITEMS_CUSTOMER = [
  `Đây là cổng thông tin dành cho học viên và thí sinh thi thử online của ${APP_BRAND}.`,
  'Học viên đăng nhập bằng email/SĐT đã đăng ký tại trung tâm. Có thể dùng Google nếu Gmail trùng email hồ sơ.',
  `${APP_BRAND} tiếp nhận và quản lý thông tin học tập một cách bảo mật.`,
];

const GUIDE_ITEMS_LEAD = [
  'Dành cho thí sinh thi thử online hoặc người chưa học tại Ebest.',
  'Đăng nhập bằng SĐT/email và mật khẩu đã đặt khi đăng ký. Lần đầu sau xác nhận email, bạn sẽ hoàn thiện hồ sơ trước khi vào cổng.',
  'Chưa có tài khoản? Chọn «Đăng ký» để tạo tài khoản mới.',
];

/**
 * Trang đăng nhập – UI riêng cho khách (không dùng layout dashboard).
 * Đã đăng nhập thì chuyển về / (dashboard).
 */
export default function LoginPage() {
  const router = useRouter();
  const { login, customer, ready } = useAuth();
  const portal = usePortalSession();
  const { message: antMessage } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsEmailVerify, setNeedsEmailVerify] = useState(false);
  const [lastLoginId, setLastLoginId] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<PortalLoginMode>('customer');
  const [sessionExpired, setSessionExpired] = useState(false);
  const [googleCfg, setGoogleCfg] = useState<{
    enabled: boolean;
    clientId: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const q = new URLSearchParams(window.location.search);
    setSessionExpired(q.get('session') === 'expired');
    setLoginMode(parsePortalLoginModeFromQuery(q.get('mode')));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchPublicPortalSettings()
      .then((raw) => {
        if (cancelled) return;
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
    if (portal.status === 'loading' || !ready) return;
    if (customer || portal.actor === 'customer') {
      router.replace(homePathForPortalActor('customer'));
      return;
    }
    if (portal.actor === 'lead') {
      let cancelled = false;
      void (async () => {
        try {
          const profile = await fetchLeadProfile();
          if (cancelled) return;
          router.replace(
            resolvePostLeadLoginPath(profile, homePathForPortalActor('lead')),
          );
        } catch {
          if (!cancelled) router.replace(homePathForPortalActor('lead'));
        }
      })();
      return () => {
        cancelled = true;
      };
    }
  }, [portal, ready, customer, router]);

  const explicitRedirect = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('redirect');
  }, []);

  const onFinish = useCallback(
    async (values: { loginId: string; password: string }) => {
      setError(null);
      setNeedsEmailVerify(false);
      setLoading(true);
      const loginId = values.loginId.trim();
      setLastLoginId(loginId);
      try {
        const result = await login(loginId, values.password, {
          mode: loginMode,
        });
        if (result.ok) {
          antMessage.success('Đăng nhập thành công.');
          const actor = result.actor === 'lead' ? 'lead' : 'customer';
          if (actor === 'lead') {
            try {
              const profile = await fetchLeadProfile();
              router.replace(
                resolvePostLeadLoginPath(
                  profile,
                  postLoginPathForPortalActor('lead', explicitRedirect()),
                ),
              );
            } catch {
              router.replace(
                postLoginPathForPortalActor('lead', explicitRedirect()),
              );
            }
          } else {
            router.replace(
              postLoginPathForPortalActor('customer', explicitRedirect()),
            );
          }
        } else {
          const msg = result.message ?? 'Đăng nhập thất bại.';
          setError(msg);
          if (
            loginMode === 'lead' &&
            /xác nhận email/i.test(msg)
          ) {
            setNeedsEmailVerify(true);
          }
        }
      } finally {
        setLoading(false);
      }
    },
    [login, router, antMessage, explicitRedirect, loginMode],
  );

  if (
    ready &&
    portal.status === 'ready' &&
    (customer || portal.actor === 'customer' || portal.actor === 'lead')
  ) {
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
                  <PortalLoginModePicker
                    variant="brand"
                    className="mb-3 w-full max-w-sm"
                    value={loginMode}
                    onChange={(mode) => {
                      setLoginMode(mode);
                      setError(null);
                      setNeedsEmailVerify(false);
                    }}
                  />
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
                        href={
                          loginMode === 'lead'
                            ? '/forgot-password?mode=lead'
                            : '/forgot-password'
                        }
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
                        action={
                          needsEmailVerify && lastLoginId ? (
                            <Button
                              size="small"
                              type="primary"
                              loading={resendLoading}
                              className="!border-0 !bg-white !text-[#e35321]"
                              onClick={async () => {
                                setResendLoading(true);
                                try {
                                  const r =
                                    await leadResendEmailVerification(
                                      lastLoginId,
                                    );
                                  if (r.sent) {
                                    antMessage.success(r.message);
                                  } else {
                                    antMessage.warning(r.message);
                                  }
                                } catch (e) {
                                  antMessage.error(
                                    e instanceof Error
                                      ? e.message
                                      : 'Không gửi lại được email.',
                                  );
                                } finally {
                                  setResendLoading(false);
                                }
                              }}
                            >
                              Gửi lại email
                            </Button>
                          ) : undefined
                        }
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
                    <p className="mt-3 mb-0 text-center text-sm text-white/90">
                      Chưa có tài khoản?{' '}
                      <Link
                        href="/register"
                        className="font-semibold text-white underline decoration-white/50 underline-offset-2 hover:decoration-white"
                      >
                        Đăng ký
                      </Link>
                    </p>
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
                        mode={loginMode}
                        className="mt-1.5"
                        noteClassName="!text-white/75"
                        onLoggedIn={() => {
                          if (loginMode === 'lead') {
                            void (async () => {
                              try {
                                const profile = await fetchLeadProfile();
                                router.replace(
                                  resolvePostLeadLoginPath(
                                    profile,
                                    postLoginPathForPortalActor(
                                      'lead',
                                      explicitRedirect(),
                                    ),
                                  ),
                                );
                              } catch {
                                router.replace(
                                  postLoginPathForPortalActor(
                                    'lead',
                                    explicitRedirect(),
                                  ),
                                );
                              }
                            })();
                            return;
                          }
                          router.replace(
                            postLoginPathForPortalActor(
                              'customer',
                              explicitRedirect(),
                            ),
                          );
                        }}
                      />
                    </GoogleOAuthProvider>
                  ) : null}
                </div>
              </Col>

              {/* Desktop: phải = hướng dẫn; mobile: trên cùng — một viền ngăn với form */}
              <Col xs={24} md={12} className="order-1 md:order-2">
                <div className="border-b border-white/25 px-4 pb-4 pt-3 md:border-b-0 md:px-5 md:py-4 md:pl-6">
                  <h3 className="mb-2 text-sm font-semibold text-white">
                    {loginMode === 'lead'
                      ? 'Thông tin dành cho thí sinh'
                      : 'Thông tin dành cho học viên'}
                  </h3>
                  <ul className="list-outside space-y-2.5 pl-4 text-sm leading-relaxed text-white">
                    {(loginMode === 'lead'
                      ? GUIDE_ITEMS_LEAD
                      : GUIDE_ITEMS_CUSTOMER
                    ).map((item, i) => (
                      <li key={i} className="marker:text-white/50">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mb-0 mt-3 text-xs leading-relaxed text-white/90">
                    Mọi thắc mắc về tài khoản hoặc đăng nhập, vui lòng liên hệ
                    trực tiếp trung tâm {APP_BRAND} hoặc{' '}
                    <FanpageContactLink
                      label="Fanpage chính thức"
                      className="font-medium text-white underline decoration-white/50 underline-offset-2 hover:text-white hover:decoration-white"
                    />
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
