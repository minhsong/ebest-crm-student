import type { ReactNode } from 'react';
import Link from 'next/link';
import { Card, Col, Divider, Row, Typography } from 'antd';
import { EbestLogo } from '@/components/branding/EbestLogo';
import { APP_BRAND, APP_NAME, EBEST_BRAND_ORANGE } from '@/lib/ui-constants';
import { PORTAL_LOGIN_PATH } from '@/lib/portal-auth/session-routes';

const { Title, Text } = Typography;

type AuthWideFormLayoutProps = {
  /** Tiêu đề chính (vd: Quên mật khẩu / Đặt lại mật khẩu) */
  title: string;
  /** Dòng phụ dưới tiêu đề — mặc định brand + app */
  subtitle?: ReactNode;
  /** Cột trái: form */
  children: ReactNode;
  /** Cột phải: hướng dẫn / mẹo */
  sidebar: ReactNode;
  /** Hiện link về đăng nhập dưới form — mặc định true */
  showLoginLink?: boolean;
};

/**
 * Layout 2 cột (form + sidebar) cho trang recovery auth (forgot / reset).
 * Dùng Ant Design Typography + Card; brand accent đồng bộ login.
 */
export function AuthWideFormLayout({
  title,
  subtitle = (
    <>
      {APP_BRAND} {APP_NAME}
    </>
  ),
  children,
  sidebar,
  showLoginLink = true,
}: AuthWideFormLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex justify-center">
          <Link href={PORTAL_LOGIN_PATH} aria-label="Về trang đăng nhập">
            <EbestLogo variant="login-hero" priority />
          </Link>
        </div>
        <Title level={3} className="!mb-1 !mt-0 text-center !text-gray-800">
          {title}
        </Title>
        {subtitle != null && (
          <Text
            className="mb-8 block text-center text-base font-medium"
            style={{ color: EBEST_BRAND_ORANGE }}
          >
            {subtitle}
          </Text>
        )}

        <Card className="overflow-hidden shadow-md" bordered={false}>
          <Row gutter={[32, 24]}>
            <Col xs={24} md={12} className="order-2 md:order-1">
              {children}
              {showLoginLink ? (
                <div className="mt-4 text-center">
                  <Link
                    href={PORTAL_LOGIN_PATH}
                    className="text-sm font-medium hover:underline"
                    style={{ color: EBEST_BRAND_ORANGE }}
                  >
                    ← Quay lại đăng nhập
                  </Link>
                </div>
              ) : null}
            </Col>

            <Col xs={24} md={0}>
              <Divider className="my-4" />
            </Col>

            <Col xs={24} md={12} className="order-1 md:order-2">
              {sidebar}
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
}
