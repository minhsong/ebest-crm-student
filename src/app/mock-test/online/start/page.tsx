import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { assertPortalMockTestAccess } from '@/features/portal-mock-test/server/access-guards.server';
import { logInternalApiError } from '@/lib/student-safe-errors';
import { PortalMockTestOnlineStartClient } from './start-client';

export const dynamic = 'force-dynamic';

/**
 * Entry online — guard read-only ở SSR để không nháy spinner;
 * mutation bootstrap thực hiện trong Server Action (POST-only).
 */
export default async function PortalMockTestOnlineStartPage() {
  try {
    const principal = await resolvePortalMockTestPrincipal();

    assertPortalMockTestAccess(principal, {
      returnUrl: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      capability: 'exam.start',
    });

    return <PortalMockTestOnlineStartClient />;
  } catch (error) {
    // redirect() của Next ném NEXT_REDIRECT — không report.
    const digest =
      error && typeof error === 'object' && 'digest' in error
        ? String((error as { digest?: unknown }).digest ?? '')
        : '';
    if (digest.startsWith('NEXT_REDIRECT') || digest.startsWith('NEXT_NOT_FOUND')) {
      throw error;
    }
    logInternalApiError('mock-test-online-start-ssr', error, {
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      method: 'GET',
      errorType: 'server_component_render',
    });
    throw error;
  }
}
