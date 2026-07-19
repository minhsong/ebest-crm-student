import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { assertPortalMockTestAccess } from '@/features/portal-mock-test/server/access-guards.server';
import { PortalMockTestOnlineStartClient } from './start-client';

export const dynamic = 'force-dynamic';

/**
 * Entry online — guard read-only ở SSR để không nháy spinner;
 * mutation bootstrap thực hiện trong Server Action (POST-only).
 */
export default async function PortalMockTestOnlineStartPage() {
  const principal = await resolvePortalMockTestPrincipal();

  assertPortalMockTestAccess(principal, {
    returnUrl: PORTAL_MOCK_TEST_ROUTES.onlineStart,
    capability: 'exam.start',
  });

  return <PortalMockTestOnlineStartClient />;
}
