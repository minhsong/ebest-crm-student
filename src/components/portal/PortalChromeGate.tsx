'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { LoadingState } from '@/components/layout';
import { LeadAuthenticatedLayoutClient } from '@/components/lead-portal/LeadAuthenticatedLayoutClient';
import { MockTestOnlineSiteLayout } from '@/components/public-mock-test-online/MockTestOnlineSiteLayout';
import { isMockTestOnlineExamFocusPath } from '@/lib/public-mock-test-online/mock-test-online-nav.config';
import { usePortalSession } from '@/hooks/usePortalSession';
import { CustomerPortalChromeClient } from './CustomerPortalChromeClient';

type Props = {
  children: ReactNode;
};

/**
 * LP-D2 — cookie quyết định chrome trên funnel mock-test-online.
 */
export function PortalChromeGate({ children }: Props) {
  const session = usePortalSession();
  const pathname = usePathname() ?? '';
  const examFocus = isMockTestOnlineExamFocusPath(pathname);

  if (session.status === 'loading') {
    return (
      <div className="ebest-mock-test-embed-root flex min-h-[40vh] items-center justify-center">
        <LoadingState tip="Đang tải phiên…" />
      </div>
    );
  }

  if (session.actor === 'lead') {
    return (
      <LeadAuthenticatedLayoutClient
        allowMockTestFunnel
        sidebarCollapsedDefault={examFocus}
      >
        {children}
      </LeadAuthenticatedLayoutClient>
    );
  }

  if (session.actor === 'customer') {
    return (
      <CustomerPortalChromeClient sidebarCollapsedDefault={examFocus}>
        {children}
      </CustomerPortalChromeClient>
    );
  }

  return <MockTestOnlineSiteLayout>{children}</MockTestOnlineSiteLayout>;
}
