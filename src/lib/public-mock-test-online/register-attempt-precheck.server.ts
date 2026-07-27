import { redirect } from 'next/navigation';
import {
  fetchMockTestOnlineAttemptStatusNoStore,
} from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { resolveAttemptRegisterRedirectPath } from '@/lib/public-mock-test-online/attempt-status-redirect.server';
import { isMockTestOnlineAttemptBlocked } from '@/lib/public-mock-test-online/mock-test-online-attempt-limit.util';
import { MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE } from '@/lib/public-mock-test-online/constants';
import { resolveMtoCallerIdentityFromCookies } from '@/features/portal-mock-test/server/resolve-mto-caller-identity.server';
import type { MockTestOnlineAttemptStatus } from '@/lib/public-mock-test-online/types';
import {
  logPortalBootstrap,
  summarizeAttemptStatus,
} from '@/lib/portal-ssr-debug';

export {
  MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
} from '@/lib/public-mock-test-online/constants';

export type RegisterAttemptPrecheckResult = {
  redirectPath: string | null;
  status: MockTestOnlineAttemptStatus | null;
  httpStatus: number;
  blocked: boolean;
  omniLeadIdUsed: string | null;
  identitySource: 'hint' | 'cookie_resolve' | 'skipped_no_omni';
};

/**
 * Pre-check lượt thi — trả kết quả thay vì redirect (Server Action dùng return redirectTo).
 */
export async function evaluateLeadRegisterAttemptPrecheck(
  omniLeadId: string,
  testTypeCode = MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
  phoneNormalized?: string | null,
  traceId?: string,
): Promise<RegisterAttemptPrecheckResult> {
  const { status, httpStatus } = await fetchMockTestOnlineAttemptStatusNoStore(
    omniLeadId,
    testTypeCode,
    phoneNormalized?.trim()
      ? { phoneNormalized: phoneNormalized.trim() }
      : undefined,
  );

  const redirectPath = resolveAttemptRegisterRedirectPath(status);
  const blocked = redirectPath != null;

  logPortalBootstrap('attempt_precheck.lead', {
    traceId,
    httpStatus,
    blocked,
    redirectPath,
    isBlockedUtil: isMockTestOnlineAttemptBlocked(status),
    attemptStatus: summarizeAttemptStatus(
      status as Record<string, unknown> | null,
    ),
  });

  return {
    redirectPath,
    status,
    httpStatus,
    blocked,
    omniLeadIdUsed: omniLeadId.trim() || null,
    identitySource: 'hint',
  };
}

export type CustomerAttemptPrecheckHints = {
  omniLeadId?: string | null;
  phoneE164?: string | null;
};

/**
 * P5c — HV portal: resolve omniLeadId (session embed → bootstrap fallback) rồi precheck.
 */
export async function evaluateCustomerRegisterAttemptPrecheck(
  customerId: number,
  testTypeCode = MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
  hints?: CustomerAttemptPrecheckHints,
  traceId?: string,
): Promise<RegisterAttemptPrecheckResult> {
  const hintOmni = hints?.omniLeadId?.trim() || '';
  if (hintOmni) {
    const result = await evaluateLeadRegisterAttemptPrecheck(
      hintOmni,
      testTypeCode,
      hints?.phoneE164,
      traceId,
    );
    logPortalBootstrap('attempt_precheck.customer', {
      traceId,
      customerId,
      identitySource: 'session_hint',
      ...result,
      status: summarizeAttemptStatus(
        result.status as Record<string, unknown> | null,
      ),
    });
    return { ...result, identitySource: 'hint' };
  }

  const resolved = await resolveMtoCallerIdentityFromCookies();
  if (
    !resolved.ok ||
    resolved.identity.actor !== 'customer' ||
    resolved.identity.customerId !== customerId
  ) {
    logPortalBootstrap('attempt_precheck.customer_skipped', {
      traceId,
      customerId,
      identitySource: 'skipped_no_omni',
      resolveOk: resolved.ok,
      resolveActor: resolved.ok ? resolved.identity.actor : null,
      resolveCustomerId: resolved.ok ? resolved.identity.customerId : null,
    });
    return {
      redirectPath: null,
      status: null,
      httpStatus: 0,
      blocked: false,
      omniLeadIdUsed: null,
      identitySource: 'skipped_no_omni',
    };
  }

  const result = await evaluateLeadRegisterAttemptPrecheck(
    resolved.identity.omniLeadId,
    testTypeCode,
    resolved.identity.phoneE164,
    traceId,
  );
  logPortalBootstrap('attempt_precheck.customer', {
    traceId,
    customerId,
    identitySource: 'cookie_resolve',
    ...result,
    status: summarizeAttemptStatus(
      result.status as Record<string, unknown> | null,
    ),
  });
  return { ...result, identitySource: 'cookie_resolve' };
}

/** Pre-check lượt thi trước fast-path register/bootstrap (G2). Redirect khi hết lượt. */
export async function redirectLeadRegisterIfAttemptBlocked(
  omniLeadId: string,
  testTypeCode = MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
  phoneNormalized?: string | null,
): Promise<void> {
  const { redirectPath } = await evaluateLeadRegisterAttemptPrecheck(
    omniLeadId,
    testTypeCode,
    phoneNormalized,
  );
  if (redirectPath) redirect(redirectPath);
}

/** @deprecated Prefer evaluateCustomerRegisterAttemptPrecheck trong Server Action. */
export async function redirectCustomerRegisterIfAttemptBlocked(
  customerId: number,
  testTypeCode = MOCK_TEST_ONLINE_DEFAULT_TEST_TYPE,
  hints?: CustomerAttemptPrecheckHints,
): Promise<void> {
  const { redirectPath } = await evaluateCustomerRegisterAttemptPrecheck(
    customerId,
    testTypeCode,
    hints,
  );
  if (redirectPath) redirect(redirectPath);
}
