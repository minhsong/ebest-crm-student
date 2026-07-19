import { redirect } from 'next/navigation';
import type { PortalMockTestPrincipal } from '../identity/types';
import { isLeadMockTestPrincipal } from '../identity/types';
import { PORTAL_MOCK_TEST_ROUTES } from '../routes.config';
import { buildLeadCompleteProfilePath } from '@/lib/portal-auth/session-routes';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';
import {
  requiresCompletedLeadProfile,
  type PortalMockTestCapability,
} from '../domain/portal-profile-capability';

type GuardOptions = {
  returnUrl: string;
  capability: PortalMockTestCapability;
  /** Mặc định chỉ lead + customer. */
  allowActors?: Array<'lead' | 'customer'>;
};

function loginRedirect(returnUrl: string, mode: 'lead' | 'student'): string {
  return buildPortalLoginHref({ mode, returnUrl });
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
    requiresCompletedLeadProfile(options.capability) &&
    isLeadMockTestPrincipal(principal) &&
    !principal.profileCompleted
  ) {
    redirect(buildLeadCompleteProfilePath(returnUrl));
  }
}
