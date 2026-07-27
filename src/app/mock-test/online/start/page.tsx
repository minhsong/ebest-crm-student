import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { assertPortalMockTestAccess } from '@/features/portal-mock-test/server/access-guards.server';
import {
  isUpstreamConnectionFailure,
  logInternalApiError,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import { rethrowIfNextNavigation } from '@/lib/next-navigation-errors';
import { logPortalSsr, logPortalSsrError } from '@/lib/portal-ssr-debug';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';
import { CannotConnectToServerPanel } from '@/components/errors/CannotConnectToServerPanel';
import { MockTestStepErrorPanel } from '@/components/public-mock-test-online/MockTestStepErrorPanel';
import { PortalMockTestOnlineStartClient } from './start-client';

export const dynamic = 'force-dynamic';

/**
 * Entry online — guard read-only ở SSR để không nháy spinner;
 * mutation bootstrap thực hiện trong Server Action (POST-only).
 *
 * Không rethrow lỗi thường lên error.tsx production (message bị che);
 * log chi tiết server-side rồi trả panel thân thiện.
 */
export default async function PortalMockTestOnlineStartPage() {
  const started = Date.now();
  logPortalSsr('online_start.begin', {
    path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
  });
  try {
    const principal = await resolvePortalMockTestPrincipal();
    logPortalSsr('online_start.principal', {
      actor: principal.actor,
      durationMs: Date.now() - started,
    });

    assertPortalMockTestAccess(principal, {
      returnUrl: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      capability: 'exam.start',
    });

    logPortalSsr('online_start.render_ok', {
      actor: principal.actor,
      durationMs: Date.now() - started,
    });
    return (
      <MockTestClientErrorBoundary variant="portal">
        <PortalMockTestOnlineStartClient />
      </MockTestClientErrorBoundary>
    );
  } catch (error) {
    rethrowIfNextNavigation(error);

    logPortalSsrError('online_start.failed', error, {
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      durationMs: Date.now() - started,
      connectionFailure: isUpstreamConnectionFailure(error),
    });
    logInternalApiError('mock-test-online-start-ssr', error, {
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      method: 'GET',
      errorType: 'server_component_render',
    });

    if (isUpstreamConnectionFailure(error)) {
      return <CannotConnectToServerPanel />;
    }

    return (
      <MockTestStepErrorPanel
        variant="portal"
        description={STUDENT_SAFE_USER_MESSAGES.generic}
      />
    );
  }
}
