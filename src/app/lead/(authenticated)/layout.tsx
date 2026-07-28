import type { ReactNode } from 'react';
import { LeadAuthenticatedLayoutClient } from '@/components/lead-portal/LeadAuthenticatedLayoutClient';
import { buildPageMetadata } from '@/lib/metadata';

export const metadata = buildPageMetadata({
  title: 'Cổng thí sinh',
  description: 'Khu vực dành cho thí sinh thi thử online Ebest English.',
  path: '/lead',
});

/** Lead chrome — session SSOT từ root `PortalSessionProvider` (không probe lại). */
export default function LeadAuthenticatedGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <LeadAuthenticatedLayoutClient>{children}</LeadAuthenticatedLayoutClient>;
}
