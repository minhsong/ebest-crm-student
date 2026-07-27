'use server';

import { randomUUID } from 'crypto';
import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import {
  isLeadMockTestPrincipal,
  isPortalMockTestCustomerPrincipal,
} from '@/features/portal-mock-test/identity/types';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import {
  evaluateCustomerRegisterAttemptPrecheck,
  evaluateLeadRegisterAttemptPrecheck,
} from '@/lib/public-mock-test-online/register-attempt-precheck.server';
import { clearMockTestOnlineFunnelSessionCookieStore } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { getPortalMockTestAccessRedirect } from '@/features/portal-mock-test/server/access-guards.server';
import { isNextNavigationError } from '@/lib/next-navigation-errors';
import {
  isUpstreamConnectionFailure,
  logInternalApiError,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import {
  logPortalBootstrap,
  logPortalSsr,
  logPortalSsrError,
  summarizeAttemptStatus,
  summarizeBootstrapPrincipal,
} from '@/lib/portal-ssr-debug';

export type StartOnlineBootstrapState =
  | { redirectTo: string }
  | { error: string }
  | null;

/**
 * Auth-first (PO-D24/D25): không mint Funnel cookie / lead-pending.
 * Guest → login; đã auth → clear legacy cookie + select-exam.
 *
 * Trả `{ redirectTo }` thay vì `redirect()` — tránh lỗi Next.js Server Action
 * (client nhận digest "Server Components render" thay vì navigation).
 */
export async function startPortalOnlineBootstrapAction(): Promise<StartOnlineBootstrapState> {
  const started = Date.now();
  const traceId = randomUUID();

  logPortalBootstrap('online_start_action.begin', {
    traceId,
    path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
  });
  logPortalSsr('online_start_action.begin', {
    traceId,
    path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
  });

  let lastAttemptSummary: Record<string, unknown> | null = null;
  let lastPrecheckMeta: Record<string, unknown> | null = null;

  try {
    const principal = await resolvePortalMockTestPrincipal();
    const principalSummary = summarizeBootstrapPrincipal(
      principal as Record<string, unknown>,
    );

    logPortalBootstrap('online_start_action.principal', {
      traceId,
      principal: principalSummary,
      durationMs: Date.now() - started,
    });
    logPortalSsr('online_start_action.principal', {
      traceId,
      actor: principal.actor,
      durationMs: Date.now() - started,
    });

    const accessRedirect = getPortalMockTestAccessRedirect(principal, {
      returnUrl: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      capability: 'exam.start',
    });
    if (accessRedirect) {
      logPortalBootstrap('online_start_action.access_redirect', {
        traceId,
        redirectTo: accessRedirect,
        reason: principal.actor === 'guest' ? 'guest' : 'actor_not_allowed',
        durationMs: Date.now() - started,
      });
      return { redirectTo: accessRedirect };
    }

    if (isLeadMockTestPrincipal(principal)) {
      const precheck = await evaluateLeadRegisterAttemptPrecheck(
        principal.omniLeadId,
        undefined,
        principal.phoneE164,
        traceId,
      );
      lastAttemptSummary = summarizeAttemptStatus(
        precheck.status as Record<string, unknown> | null,
      );
      lastPrecheckMeta = {
        actor: 'lead',
        httpStatus: precheck.httpStatus,
        blocked: precheck.blocked,
        identitySource: precheck.identitySource,
        omniLeadIdUsed: precheck.omniLeadIdUsed,
      };

      if (precheck.redirectPath) {
        logPortalBootstrap('online_start_action.attempt_blocked', {
          traceId,
          redirectTo: precheck.redirectPath,
          ...lastPrecheckMeta,
          attemptStatus: lastAttemptSummary,
          durationMs: Date.now() - started,
        });
        return { redirectTo: precheck.redirectPath };
      }
    } else if (isPortalMockTestCustomerPrincipal(principal)) {
      const precheck = await evaluateCustomerRegisterAttemptPrecheck(
        principal.customerId,
        undefined,
        {
          omniLeadId: principal.omniLeadId,
          phoneE164: principal.phoneE164,
        },
        traceId,
      );
      lastAttemptSummary = summarizeAttemptStatus(
        precheck.status as Record<string, unknown> | null,
      );
      lastPrecheckMeta = {
        actor: 'customer',
        customerId: principal.customerId,
        httpStatus: precheck.httpStatus,
        blocked: precheck.blocked,
        identitySource: precheck.identitySource,
        omniLeadIdUsed: precheck.omniLeadIdUsed,
      };

      if (precheck.redirectPath) {
        logPortalBootstrap('online_start_action.attempt_blocked', {
          traceId,
          redirectTo: precheck.redirectPath,
          ...lastPrecheckMeta,
          attemptStatus: lastAttemptSummary,
          durationMs: Date.now() - started,
        });
        return { redirectTo: precheck.redirectPath };
      }
    } else {
      logPortalBootstrap('online_start_action.unexpected_actor', {
        traceId,
        actor: principal.actor,
        redirectTo: PORTAL_MOCK_TEST_ROUTES.hub,
      });
      return { redirectTo: PORTAL_MOCK_TEST_ROUTES.hub };
    }

    try {
      clearMockTestOnlineFunnelSessionCookieStore();
      logPortalBootstrap('online_start_action.cookies_cleared', { traceId });
    } catch (clearErr) {
      logPortalSsrError('online_start_action.clear_cookie_failed', clearErr, {
        traceId,
        durationMs: Date.now() - started,
      });
    }

    logPortalBootstrap('online_start_action.success', {
      traceId,
      redirectTo: PORTAL_MOCK_TEST_ROUTES.onlineSelect,
      precheck: lastPrecheckMeta,
      attemptStatus: lastAttemptSummary,
      durationMs: Date.now() - started,
    });
    logPortalSsr('online_start_action.redirect', {
      traceId,
      to: PORTAL_MOCK_TEST_ROUTES.onlineSelect,
      durationMs: Date.now() - started,
    });

    return { redirectTo: PORTAL_MOCK_TEST_ROUTES.onlineSelect };
  } catch (error) {
    if (isNextNavigationError(error)) {
      logPortalBootstrap('online_start_action.navigation_throw', {
        traceId,
        durationMs: Date.now() - started,
      });
      logPortalSsr('online_start_action.navigation', {
        traceId,
        durationMs: Date.now() - started,
        kind: 'redirect_or_not_found',
      });
      throw error;
    }

    logPortalBootstrap('online_start_action.failed', {
      traceId,
      message: error instanceof Error ? error.message : String(error),
      precheck: lastPrecheckMeta,
      attemptStatus: lastAttemptSummary,
      durationMs: Date.now() - started,
      connectionFailure: isUpstreamConnectionFailure(error),
    });
    logPortalSsrError('online_start_action.failed', error, {
      traceId,
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      durationMs: Date.now() - started,
      connectionFailure: isUpstreamConnectionFailure(error),
      precheck: lastPrecheckMeta,
      attemptStatus: lastAttemptSummary,
    });
    logInternalApiError('mock-test-online-start-bootstrap', error, {
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      method: 'POST',
      errorType: 'server_action',
      requestId: traceId,
      details: {
        durationMs: Date.now() - started,
        connectionFailure: isUpstreamConnectionFailure(error),
        precheck: lastPrecheckMeta,
        attemptStatus: lastAttemptSummary,
      },
    });

    if (isUpstreamConnectionFailure(error)) {
      return { error: STUDENT_SAFE_USER_MESSAGES.network };
    }

    return { error: STUDENT_SAFE_USER_MESSAGES.generic };
  }
}
