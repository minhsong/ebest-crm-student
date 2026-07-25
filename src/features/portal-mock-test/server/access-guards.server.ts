import { redirect } from 'next/navigation';
import type { PortalMockTestPrincipal } from '../identity/types';
import {
  isLeadMockTestPrincipal,
  isPortalMockTestCustomerPrincipal,
} from '../identity/types';
import { PORTAL_MOCK_TEST_ROUTES } from '../routes.config';
import { buildLeadCompleteProfilePath } from '@/lib/portal-auth/session-routes';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';
import {
  shouldEnforceProfileCompletion,
  type PortalMockTestCapability,
} from '../domain/portal-profile-capability';
import { fetchPortalMockTestExamHome } from './fetch-my-exam-home.server';

type GuardOptions = {
  returnUrl: string;
  capability: PortalMockTestCapability;
  /** Mặc định chỉ lead + customer. */
  allowActors?: Array<'lead' | 'customer'>;
  /**
   * PO-D30 — mặc định lấy từ my-exam-home khi capability cần hồ sơ.
   * Truyền sẵn để tránh fetch trùng.
   */
  hasCompletedOnlineExam?: boolean;
};

function loginRedirect(returnUrl: string, mode: 'lead' | 'student'): string {
  return buildPortalLoginHref({ mode, returnUrl });
}

function profileCompletedOf(principal: PortalMockTestPrincipal): boolean {
  if (isLeadMockTestPrincipal(principal)) return principal.profileCompleted;
  if (isPortalMockTestCustomerPrincipal(principal)) {
    return principal.profileCompleted;
  }
  return true;
}

function profileCompletionRedirect(
  principal: Exclude<PortalMockTestPrincipal, { actor: 'guest' }>,
  returnUrl: string,
): string {
  if (isLeadMockTestPrincipal(principal)) {
    return buildLeadCompleteProfilePath(returnUrl);
  }
  // Customer chưa có wizard Lead — về hub kèm notice (cập nhật SĐT hồ sơ HV).
  const q = new URLSearchParams({ notice: 'profile_required' });
  return `${PORTAL_MOCK_TEST_ROUTES.hub}?${q.toString()}`;
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
}

/**
 * Gate kèm tín hiệu ≥1 bài (PO-D30) — dùng cho hub / results / offline.
 */
export async function assertPortalMockTestAccessWithExamHome(
  principal: PortalMockTestPrincipal,
  options: GuardOptions,
): Promise<void> {
  assertPortalMockTestAccess(principal, options);

  const profileCompleted = profileCompletedOf(principal);
  if (profileCompleted) return;

  let hasCompletedOnlineExam = options.hasCompletedOnlineExam;
  if (hasCompletedOnlineExam == null) {
    const home = await fetchPortalMockTestExamHome();
    hasCompletedOnlineExam = home?.hasCompletedOnlineExam === true;
  }

  if (
    shouldEnforceProfileCompletion({
      capability: options.capability,
      profileCompleted,
      hasCompletedOnlineExam,
    })
  ) {
    redirect(profileCompletionRedirect(principal, options.returnUrl));
  }
}
