import { redirect } from 'next/navigation';

import { buildPageMetadata } from '@/lib/metadata';
import { toPortalLeadSessionSummary } from '@/lib/portal-auth/portal-lead-session.types';
import { resolveLeadPostLoginDestination } from '@/lib/portal-auth/resolve-lead-navigation';
import { getCachedPortalSession } from '@/lib/portal-auth/resolve-portal-session.server';

import { PORTAL_LOGIN_PATH } from '@/lib/portal-auth/session-routes';

import DashboardLayoutClient from './DashboardLayoutClient';

export const metadata = buildPageMetadata({
  title: 'Tổng quan',
  description:
    'Cổng học viên Ebest English – Xem lịch học, điểm danh, bài tập và hóa đơn. The best home for English lovers.',
  path: '/',
});

/** Dashboard HV — chỉ customer; lead/guest redirect trước khi render chrome. */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCachedPortalSession();

  if (session.actor === 'guest') {
    redirect(PORTAL_LOGIN_PATH);
  }

  if (session.actor === 'lead') {
    redirect(
      resolveLeadPostLoginDestination(
        toPortalLeadSessionSummary(session.profile),
      ),
    );
  }

  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
