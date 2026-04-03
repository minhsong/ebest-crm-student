import type { ReactNode } from 'react';
import { Card, Col, Divider, Row } from 'antd';
import { APP_BRAND, APP_NAME } from '@/lib/ui-constants';

type AuthWideFormLayoutProps = {
  /** Tiêu đề chính (vd: Đăng nhập / Quên mật khẩu) */
  title: string;
  /** Dòng phụ dưới tiêu đề — mặc định brand + app */
  subtitle?: ReactNode;
  /** Cột trái: form */
  children: ReactNode;
  /** Cột phải: hướng dẫn / mẹo */
  sidebar: ReactNode;
};

/**
 * Layout 2 cột (form + sidebar) đồng bộ với trang đăng nhập.
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
}: AuthWideFormLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-1 mt-0 text-center text-2xl font-semibold text-gray-800">
          {title}
        </h1>
        {subtitle != null && (
          <h2 className="mb-8 mt-0 text-center text-xl font-medium text-blue-600">
            {subtitle}
          </h2>
        )}

        <Card className="overflow-hidden shadow-md" bordered={false}>
          <Row gutter={[32, 24]}>
            <Col xs={24} md={12} className="order-2 md:order-1">
              {children}
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
