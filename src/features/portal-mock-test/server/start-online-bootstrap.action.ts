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

export type StartOnlineBootstrapState = { error: string } | null;

/**
 * Auth-first (PO-D24/D25): không mint Funnel cookie / lead-pending.
 * Guest → login; đã auth → clear legacy cookie + select-exam.
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
    await redirectCustomerRegisterIfAttemptBlocked(principal.customerId, undefined, {
      omniLeadId: principal.omniLeadId,
      phoneE164: principal.phoneE164,
    });
  } else {
    redirect(PORTAL_MOCK_TEST_ROUTES.hub);
  }

  clearMockTestOnlineFunnelSessionCookieStore();
  redirect(PORTAL_MOCK_TEST_ROUTES.onlineSelect);
}
