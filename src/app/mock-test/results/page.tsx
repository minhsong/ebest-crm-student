import { LeadMockTestResultsView } from '@/features/mock-test-portal/components/LeadMockTestResultsView';
import { StudentMockTestResultsView } from '@/features/mock-test-portal/components/StudentMockTestResultsView';
import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import { assertPortalMockTestAccess } from '@/features/portal-mock-test/server/access-guards.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { buildPageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Lịch sử thi thử',
  description:
    'Theo dõi buổi thi tại trung tâm và kết quả thi thử online trên cổng Ebest English.',
  path: PORTAL_MOCK_TEST_ROUTES.results,
});

export default async function PortalMockTestResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const principal = await resolvePortalMockTestPrincipal();
  const sp = await searchParams;

  assertPortalMockTestAccess(principal, {
    returnUrl: PORTAL_MOCK_TEST_ROUTES.results,
  });

  if (principal.actor === 'customer') {
    return <StudentMockTestResultsView notice={sp.notice?.trim() || null} />;
  }

  return <LeadMockTestResultsView notice={sp.notice?.trim() || null} />;
}
