import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { LeadAuthenticatedLayoutClient } from '@/components/lead-portal/LeadAuthenticatedLayoutClient';
import { buildPageMetadata } from '@/lib/metadata';
import { getPortalRequestPathname } from '@/lib/portal-auth/get-portal-request-path.server';
import { buildAuthRequiredLoginHref } from '@/lib/portal-auth/portal-session-recovery';
import { getCachedPortalSession } from '@/lib/portal-auth/resolve-portal-session.server';

export const metadata = buildPageMetadata({
  title: 'Cổng thí sinh',
  description: 'Khu vực dành cho thí sinh thi thử online Ebest English.',
  path: '/lead',
});

/** Lead chrome — SSR gate auth; session SSOT từ root `PortalSessionProvider`. */
export default async function LeadAuthenticatedGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getCachedPortalSession();
  const returnUrl = await getPortalRequestPathname('/lead');

  if (session.actor === 'guest') {
    redirect(
      buildAuthRequiredLoginHref({
        returnUrl,
        authFailure: session.authFailure,
      }),
    );
  }

  if (session.actor === 'customer') {
    redirect('/');
  }

  return <LeadAuthenticatedLayoutClient>{children}</LeadAuthenticatedLayoutClient>;
}
