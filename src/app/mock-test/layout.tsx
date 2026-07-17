import type { ReactNode } from 'react';
import { PortalChromeGate } from '@/components/portal/PortalChromeGate';
import { buildPageMetadata } from '@/lib/metadata';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

export const metadata = buildPageMetadata({
  title: 'Thi thử',
  description: 'Đăng ký và theo dõi thi thử online, offline tại Ebest English.',
  path: PORTAL_MOCK_TEST_ROUTES.hub,
});

export default function PortalMockTestLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PortalChromeGate>{children}</PortalChromeGate>;
}
