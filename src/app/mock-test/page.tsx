import { MockTestHub } from '@/features/portal-mock-test/components/MockTestHub';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';
import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import { assertPortalMockTestAccessWithExamHome } from '@/features/portal-mock-test/server/access-guards.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { fetchCustomerOnlineAttemptStatusSsr } from '@/features/portal-mock-test/server/fetch-customer-attempt-status.server';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import { fetchMockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { fetchPortalMockTestExamHome } from '@/features/portal-mock-test/server/fetch-my-exam-home.server';

export const dynamic = 'force-dynamic';

export default async function PortalMockTestHubPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const principal = await resolvePortalMockTestPrincipal();
  const examHome = await fetchPortalMockTestExamHome();
  const sp = await searchParams;

  await assertPortalMockTestAccessWithExamHome(principal, {
    returnUrl: PORTAL_MOCK_TEST_ROUTES.hub,
    capability: 'portal.hub',
    hasCompletedOnlineExam: examHome?.hasCompletedOnlineExam === true,
  });

  const attemptStatus =
    principal.actor === 'lead'
      ? await fetchMockTestOnlineAttemptStatus(
          principal.omniLeadId,
          MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
          principal.phoneE164
            ? { phoneNormalized: principal.phoneE164 }
            : undefined,
        )
      : principal.actor === 'customer'
        ? await fetchCustomerOnlineAttemptStatusSsr()
        : null;

  return (
    <MockTestClientErrorBoundary variant="portal">
      <MockTestHub
        principal={principal}
        attemptStatus={attemptStatus}
        notice={sp.notice?.trim() || null}
        hasCompletedOnlineExam={examHome?.hasCompletedOnlineExam === true}
      />
    </MockTestClientErrorBoundary>
  );
}
