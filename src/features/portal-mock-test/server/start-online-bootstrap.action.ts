'use server';

import { redirect } from 'next/navigation';
import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import {
  isLeadMockTestPrincipal,
  isPortalMockTestCustomerPrincipal,
} from '@/features/portal-mock-test/identity/types';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import {
  redirectLeadRegisterIfAttemptBlocked,
  redirectCustomerRegisterIfAttemptBlocked,
} from '@/lib/public-mock-test-online/register-attempt-precheck.server';
import { clearMockTestOnlineFunnelSessionCookieStore } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { assertPortalMockTestAccess } from '@/features/portal-mock-test/server/access-guards.server';
import { rethrowIfNextNavigation } from '@/lib/next-navigation-errors';
import {
  isUpstreamConnectionFailure,
  logInternalApiError,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';

export type StartOnlineBootstrapState = { error: string } | null;

/**
 * Auth-first (PO-D24/D25): không mint Funnel cookie / lead-pending.
 * Guest → login; đã auth → clear legacy cookie + select-exam.
 */
export async function startPortalOnlineBootstrapAction(): Promise<StartOnlineBootstrapState> {
  try {
    const principal = await resolvePortalMockTestPrincipal();

    assertPortalMockTestAccess(principal, {
      returnUrl: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      capability: 'exam.start',
    });

    if (isLeadMockTestPrincipal(principal)) {
      await redirectLeadRegisterIfAttemptBlocked(
        principal.omniLeadId,
        undefined,
        principal.phoneE164,
      );
    } else if (isPortalMockTestCustomerPrincipal(principal)) {
      await redirectCustomerRegisterIfAttemptBlocked(principal.customerId, undefined, {
        omniLeadId: principal.omniLeadId,
        phoneE164: principal.phoneE164,
      });
    } else {
      redirect(PORTAL_MOCK_TEST_ROUTES.hub);
    }

    try {
      clearMockTestOnlineFunnelSessionCookieStore();
    } catch {
      // best-effort clear legacy cookies
    }

    redirect(PORTAL_MOCK_TEST_ROUTES.onlineSelect);
  } catch (error) {
    rethrowIfNextNavigation(error);

    logInternalApiError('mock-test-online-start-bootstrap', error, {
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      method: 'POST',
      errorType: 'server_action',
    });

    if (isUpstreamConnectionFailure(error)) {
      return { error: STUDENT_SAFE_USER_MESSAGES.network };
    }

    return { error: STUDENT_SAFE_USER_MESSAGES.generic };
  }
}
