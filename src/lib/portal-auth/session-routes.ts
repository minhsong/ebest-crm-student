import type { PortalAuthActor } from '@/lib/portal-auth/portal-auth-session';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import {
  PORTAL_RETURN_URL_QUERY,
  buildPortalLoginHref,
  sanitizePortalReturnUrl,
} from '@/lib/portal-auth/post-auth-return-url';

export const PORTAL_MOCK_TEST_RESULTS_ROUTES = {
  lead: PORTAL_MOCK_TEST_ROUTES.results,
  student: PORTAL_MOCK_TEST_ROUTES.results,
  /** Unified login (customer → lead fallback). */
  login: '/login',
} as const;

/** Gate sau đăng ký cơ bản — bắt buộc trước layout lead đầy đủ. */
export const LEAD_COMPLETE_PROFILE_PATH = '/lead/complete-profile' as const;

export function isLeadCompleteProfilePath(pathname: string | null | undefined): boolean {
  const n = (pathname ?? '').split('?')[0]?.replace(/\/$/, '') || '/';
  return (
    n === LEAD_COMPLETE_PROFILE_PATH ||
    n.startsWith(`${LEAD_COMPLETE_PROFILE_PATH}/`)
  );
}

/** nextPath từ post-exam destination trỏ wizard hoàn thiện hồ sơ. */
export function isLeadCompleteProfileHref(href: string | null | undefined): boolean {
  if (!href) return false;
  const path = href.split('?')[0] ?? '';
  return isLeadCompleteProfilePath(path);
}

export function buildLeadCompleteProfilePath(returnUrl?: string | null): string {
  const safeReturnUrl = sanitizePortalReturnUrl(returnUrl);
  if (!safeReturnUrl) return LEAD_COMPLETE_PROFILE_PATH;
  const query = new URLSearchParams({
    [PORTAL_RETURN_URL_QUERY]: safeReturnUrl,
  });
  return `${LEAD_COMPLETE_PROFILE_PATH}?${query.toString()}`;
}

export type PostExamPortalSession =
  | { kind: 'none' }
  | { kind: 'customer' }
  | { kind: 'lead'; profileCompleted: boolean };

/**
 * SSOT điều hướng sau nộp bài.
 * Caller server-side phải truyền actor/profile từ JWT đã verify; client không tự
 * decode token hoặc quyết định capability.
 */
export function resolvePostExamPath(
  session: PostExamPortalSession,
  resultsPath: string = PORTAL_MOCK_TEST_RESULTS_ROUTES.lead,
): string {
  if (session.kind === 'none') {
    return buildPortalLoginHref({ returnUrl: resultsPath });
  }
  if (session.kind === 'lead' && !session.profileCompleted) {
    return buildLeadCompleteProfilePath(resultsPath);
  }
  return resultsPath;
}

export function resolvePostLeadLoginPath(
  profile: {
    identityUpgrade?: {
      applied?: boolean;
      reLoginRequired?: boolean;
      available?: boolean;
    };
    profileCompleted?: boolean;
  },
  fallback: string = PORTAL_MOCK_TEST_RESULTS_ROUTES.lead,
): string {
  // UPA-D15: convert xong → đăng nhập lại cổng HV (không silent cookie).
  if (
    profile.identityUpgrade?.available &&
    (profile.identityUpgrade.reLoginRequired ||
      profile.identityUpgrade.applied)
  ) {
    return PORTAL_MOCK_TEST_RESULTS_ROUTES.login;
  }
  if (profile.profileCompleted !== true) {
    return buildLeadCompleteProfilePath(fallback);
  }
  return fallback;
}

/** Đường dẫn sau đăng nhập unified / lead login. */
export function resolvePostPortalLoginPath(actor: PortalAuthActor): string {
  if (actor === 'lead') return PORTAL_MOCK_TEST_RESULTS_ROUTES.lead;
  return PORTAL_MOCK_TEST_RESULTS_ROUTES.student;
}
