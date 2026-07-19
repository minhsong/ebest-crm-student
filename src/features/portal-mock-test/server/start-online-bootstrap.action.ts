'use server';

import { redirect } from 'next/navigation';
import { resolvePortalMockTestPrincipal } from '@/features/portal-mock-test/identity/resolve-principal.server';
import {
  isLeadMockTestPrincipal,
  isPortalMockTestCustomerPrincipal,
} from '@/features/portal-mock-test/identity/types';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { bootstrapPortalOnlineSession } from '@/features/portal-mock-test/server/bootstrap-online.server';
import {
  redirectLeadRegisterIfAttemptBlocked,
  redirectCustomerRegisterIfAttemptBlocked,
} from '@/lib/public-mock-test-online/register-attempt-precheck.server';
import {
  writeMockTestOnlineFunnelSessionCookieStore,
  clearMockTestOnlineFunnelSessionCookieStore,
} from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { assertPortalMockTestAccess } from '@/features/portal-mock-test/server/access-guards.server';

export type StartOnlineBootstrapState = { error: string } | null;

/**
 * Server Action bootstrap thi online (POST-only — không side-effect trên GET).
 * Guest → login; profile incomplete vẫn được thi; hết lượt → results.
 * Thành công: ghi funnel cookie + redirect select-exam.
 */
export async function startPortalOnlineBootstrapAction(): Promise<StartOnlineBootstrapState> {
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
    await redirectCustomerRegisterIfAttemptBlocked(principal.customerId);
  } else {
    redirect(PORTAL_MOCK_TEST_ROUTES.hub);
  }

  const result = await bootstrapPortalOnlineSession(principal);

  if (!result.ok) {
    if (result.attemptLimit) {
      clearMockTestOnlineFunnelSessionCookieStore();
      redirect(`${PORTAL_MOCK_TEST_ROUTES.results}?notice=attempt_limit`);
    }
    return { error: result.message };
  }

  writeMockTestOnlineFunnelSessionCookieStore(result.pendingLeadId);
  redirect(
    `${PORTAL_MOCK_TEST_ROUTES.onlineSelect}?lead=${encodeURIComponent(
      result.pendingLeadId,
    )}`,
  );
}
