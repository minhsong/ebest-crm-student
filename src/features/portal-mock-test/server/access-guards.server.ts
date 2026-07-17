import { redirect } from 'next/navigation';
import type { PortalMockTestPrincipal } from '../identity/types';
import { isLeadMockTestPrincipal } from '../identity/types';
import { PORTAL_MOCK_TEST_ROUTES } from '../routes.config';
import { LEAD_COMPLETE_PROFILE_PATH } from '@/lib/portal-auth/session-routes';

type GuardOptions = {
  returnUrl: string;
  /** Mặc định chỉ lead + customer. */
  allowActors?: Array<'lead' | 'customer'>;
  requireLeadProfile?: boolean;
};

function loginRedirect(returnUrl: string, mode: 'lead' | 'student'): string {
  return `/login?mode=${mode}&returnUrl=${encodeURIComponent(returnUrl)}`;
}

/** SSR gate — redirect nếu không đủ quyền truy cập mock-test. */
export function assertPortalMockTestAccess(
  principal: PortalMockTestPrincipal,
  options: GuardOptions,
): asserts principal is Exclude<
  PortalMockTestPrincipal,
  { actor: 'guest' }
> {
  const allow = options.allowActors ?? ['lead', 'customer'];
  const returnUrl = options.returnUrl;

  if (principal.actor === 'guest') {
    redirect(loginRedirect(returnUrl, 'lead'));
  }

  if (!allow.includes(principal.actor)) {
    redirect(PORTAL_MOCK_TEST_ROUTES.hub);
  }

  if (
    options.requireLeadProfile !== false &&
    isLeadMockTestPrincipal(principal) &&
    !principal.profileCompleted
  ) {
    redirect(LEAD_COMPLETE_PROFILE_PATH);
  }
}
