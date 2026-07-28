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
import {
  isUpstreamConnectionFailure,
  logInternalApiError,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';
import {
  logPortalBootstrap,
  summarizeAttemptStatus,
  summarizeBootstrapPrincipal,
} from '@/lib/portal-ssr-debug';
import { reportStudentPortalBffError } from '@/lib/report-bff-error';

export type PortalOnlineBootstrapOk = {
  ok: true;
  redirectTo: string;
  traceId: string;
};

export type PortalOnlineBootstrapErr = {
  ok: false;
  error: string;
  traceId: string;
  /** Message kỹ thuật — chỉ log/CRM, không show UI. */
  debugMessage?: string;
};

export type PortalOnlineBootstrapResult =
  | PortalOnlineBootstrapOk
  | PortalOnlineBootstrapErr;

type Step = { at: string; step: string; data?: Record<string, unknown> };

/**
 * Core bootstrap — không dùng redirect()/notFound().
 * Dùng chung Route Handler + Server Action để tránh lỗi RSC digest opaque.
 */
export async function runPortalOnlineBootstrap(): Promise<PortalOnlineBootstrapResult> {
  const started = Date.now();
  const traceId = randomUUID();
  const steps: Step[] = [];

  const push = (step: string, data?: Record<string, unknown>) => {
    const entry: Step = {
      at: new Date().toISOString(),
      step,
      ...(data ? { data } : {}),
    };
    steps.push(entry);
    logPortalBootstrap(step, { traceId, durationMs: Date.now() - started, ...data });
  };

  push('begin', { path: PORTAL_MOCK_TEST_ROUTES.onlineStart });

  let lastAttemptSummary: Record<string, unknown> | null = null;
  let lastPrecheckMeta: Record<string, unknown> | null = null;

  try {
    const principal = await resolvePortalMockTestPrincipal();
    const principalSummary = summarizeBootstrapPrincipal(
      principal as Record<string, unknown>,
    );
    push('principal', { principal: principalSummary });

    const accessRedirect = getPortalMockTestAccessRedirect(principal, {
      returnUrl: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      capability: 'exam.start',
    });
    if (accessRedirect) {
      push('access_redirect', {
        redirectTo: accessRedirect,
        reason: principal.actor === 'guest' ? 'guest' : 'actor_not_allowed',
      });
      return { ok: true, redirectTo: accessRedirect, traceId };
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
      };
      push('attempt_precheck', {
        ...lastPrecheckMeta,
        attemptStatus: lastAttemptSummary ?? undefined,
      });

      if (precheck.redirectPath) {
        push('attempt_blocked', { redirectTo: precheck.redirectPath });
        return { ok: true, redirectTo: precheck.redirectPath, traceId };
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
      };
      push('attempt_precheck', {
        ...lastPrecheckMeta,
        attemptStatus: lastAttemptSummary ?? undefined,
      });

      if (precheck.redirectPath) {
        push('attempt_blocked', { redirectTo: precheck.redirectPath });
        return { ok: true, redirectTo: precheck.redirectPath, traceId };
      }
    } else {
      push('unexpected_actor', {
        actor: principal.actor,
        redirectTo: PORTAL_MOCK_TEST_ROUTES.hub,
      });
      return { ok: true, redirectTo: PORTAL_MOCK_TEST_ROUTES.hub, traceId };
    }

    try {
      clearMockTestOnlineFunnelSessionCookieStore();
      push('cookies_cleared');
    } catch (clearErr) {
      push('cookies_clear_failed', {
        message:
          clearErr instanceof Error ? clearErr.message : String(clearErr),
      });
    }

    push('success', { redirectTo: PORTAL_MOCK_TEST_ROUTES.onlineSelect });
    return {
      ok: true,
      redirectTo: PORTAL_MOCK_TEST_ROUTES.onlineSelect,
      traceId,
    };
  } catch (error) {
    const debugMessage =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : String(error);
    const stack = error instanceof Error ? error.stack?.slice(0, 4000) : undefined;

    push('failed', {
      message: debugMessage,
      connectionFailure: isUpstreamConnectionFailure(error),
      precheck: lastPrecheckMeta ?? undefined,
      attemptStatus: lastAttemptSummary ?? undefined,
    });

    // Relay CRM — kèm steps để debug dù client chỉ thấy digest.
    reportStudentPortalBffError(
      'mto.online-start.bootstrap-core',
      error instanceof Error ? error : new Error(debugMessage),
      {
        path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
        method: 'POST',
        errorType: 'MTO_BOOTSTRAP_SERVER_ERROR',
        requestId: traceId,
        details: {
          steps,
          precheck: lastPrecheckMeta,
          attemptStatus: lastAttemptSummary,
          durationMs: Date.now() - started,
          connectionFailure: isUpstreamConnectionFailure(error),
          stack,
        },
      },
    );
    logInternalApiError('mock-test-online-start-bootstrap', error, {
      path: PORTAL_MOCK_TEST_ROUTES.onlineStart,
      method: 'POST',
      errorType: 'server_bootstrap',
      requestId: traceId,
      details: {
        steps,
        durationMs: Date.now() - started,
        connectionFailure: isUpstreamConnectionFailure(error),
        precheck: lastPrecheckMeta,
        attemptStatus: lastAttemptSummary,
      },
    });

    return {
      ok: false,
      error: isUpstreamConnectionFailure(error)
        ? STUDENT_SAFE_USER_MESSAGES.network
        : STUDENT_SAFE_USER_MESSAGES.generic,
      traceId,
      debugMessage,
    };
  }
}
