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
import { isNextNavigationError } from '@/lib/next-navigation-errors';
import {
  isUpstreamConnectionFailure,
  logInternalApiError,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import { logPortalSsr, logPortalSsrError } from '@/lib/portal-ssr-debug';

export type StartOnlineBootstrapState = { error: string } | null;

/**
 * Auth-first (PO-D24/D25): không mint Funnel cookie / lead-pending.
 * Guest → login; đã auth → clear legacy cookie + select-exam.
 *
 * Lưu ý: HTTP 500 trên POST page = lỗi khung Next (chưa vào catch này) —
 * khi đó không relay CRM; client phải report bổ sung.
 */
export async function startPortalOnlineBootstrapAction(): Promise<StartOnlineBootstrapState> {
  const started = Date.now();
  logPortalSsr('online_start_action.begin', {
    path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
  });

  try {
    const principal = await resolvePortalMockTestPrincipal();
    logPortalSsr('online_start_action.principal', {
      actor: principal.actor,
      durationMs: Date.now() - started,
    });

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
      await redirectCustomerRegisterIfAttemptBlocked(
        principal.customerId,
        undefined,
        {
          omniLeadId: principal.omniLeadId,
          phoneE164: principal.phoneE164,
        },
      );
    } else {
      logPortalSsr('online_start_action.redirect', {
        to: PORTAL_MOCK_TEST_ROUTES.hub,
        reason: 'unexpected_actor',
      });
      redirect(PORTAL_MOCK_TEST_ROUTES.hub);
    }

    try {
      clearMockTestOnlineFunnelSessionCookieStore();
    } catch (clearErr) {
      logPortalSsrError('online_start_action.clear_cookie_failed', clearErr, {
        durationMs: Date.now() - started,
      });
    }

    logPortalSsr('online_start_action.redirect', {
      to: PORTAL_MOCK_TEST_ROUTES.onlineSelect,
      durationMs: Date.now() - started,
    });
    redirect(PORTAL_MOCK_TEST_ROUTES.onlineSelect);
  } catch (error) {
    // redirect()/notFound() — rethrow nguyên vẹn cho Next (không bọc lại).
    if (isNextNavigationError(error)) {
      logPortalSsr('online_start_action.navigation', {
        durationMs: Date.now() - started,
        kind: 'redirect_or_not_found',
      });
      throw error;
    }

    logPortalSsrError('online_start_action.failed', error, {
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      durationMs: Date.now() - started,
      connectionFailure: isUpstreamConnectionFailure(error),
    });
    logInternalApiError('mock-test-online-start-bootstrap', error, {
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      method: 'POST',
      errorType: 'server_action',
      details: {
        durationMs: Date.now() - started,
        connectionFailure: isUpstreamConnectionFailure(error),
      },
    });

    if (isUpstreamConnectionFailure(error)) {
      return { error: STUDENT_SAFE_USER_MESSAGES.network };
    }

    return { error: STUDENT_SAFE_USER_MESSAGES.generic };
  }
}
