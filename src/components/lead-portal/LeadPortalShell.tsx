'use client';

import type { ReactNode } from 'react';
import { Card, ConfigProvider, Typography } from 'antd';
import { BrandedPublicShell } from '@/components/branding/BrandedPublicShell';
import { ebestPublicAntdTheme } from '@/lib/ebest-public-antd-theme';

const { Title, Paragraph } = Typography;

type LeadPortalShellProps = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  maxWidthClass?: string;
};

/**
 * Vỏ trang lead portal — đồng bộ complete-profile / forgot-password (branded + Card + theme cam).
 */
export function LeadPortalShell({
  title,
  description,
  children,
  maxWidthClass = 'max-w-md',
}: LeadPortalShellProps) {
  return (
    <ConfigProvider theme={ebestPublicAntdTheme}>
      <BrandedPublicShell
        maxWidthClass={maxWidthClass}
        tagline="Xem kết quả thi thử TOEIC online — Ebest English"
      >
        <Card className="shadow-md" bordered={false}>
          <Title level={3} className="!mb-1 !mt-0 text-center">
            {title}
          </Title>
          {description ? (
            <Paragraph type="secondary" className="text-center !mb-6">
              {description}
            </Paragraph>
          ) : (
            <div className="mb-6" />
          )}
          {children}
        </Card>
      </BrandedPublicShell>
    </ConfigProvider>
  );
}
