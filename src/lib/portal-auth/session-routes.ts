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
} as const;

/**
 * Entry `/login` — dùng cho logout chủ động, bounce guest khỏi khu auth,
 * và link «Đăng nhập» trên trang public (không gắn returnUrl).
 * Deep-link có returnUrl → `buildPortalLoginHref`.
 */
export const PORTAL_LOGIN_PATH = '/login' as const;

/**
 * Sau logout chủ động (click Đăng xuất) — hard navigate về entry login.
 * Không dùng để đuổi guest khỏi trang public / funnel mock-test.
 */
export const PORTAL_POST_LOGOUT_PATH = PORTAL_LOGIN_PATH;

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
  | { kind: 'customer'; profileCompleted: boolean }
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
  if (session.kind === 'customer' && !session.profileCompleted) {
    const q = new URLSearchParams({ notice: 'profile_required' });
    return `${PORTAL_MOCK_TEST_ROUTES.hub}?${q.toString()}`;
  }
  return resultsPath;
}

/**
 * Điều hướng sau login Lead.
 * Mặc định = hub (trang chủ thí sinh) — không phải `/mock-test/results`.
 * `fallback` chỉ khi đã hoàn thiện hồ sơ (vd. returnUrl sau nộp bài → results).
 */
export function resolvePostLeadLoginPath(
  profile: {
    identityUpgrade?: {
      applied?: boolean;
      reLoginRequired?: boolean;
      available?: boolean;
    };
    profileCompleted?: boolean;
  },
  fallback: string = PORTAL_MOCK_TEST_ROUTES.hub,
): string {
  // UPA-D15: convert xong → đăng nhập lại cổng HV (không silent cookie).
  if (
    profile.identityUpgrade?.available &&
    (profile.identityUpgrade.reLoginRequired ||
      profile.identityUpgrade.applied)
  ) {
    return PORTAL_LOGIN_PATH;
  }
  // PO-D30: incomplete được vào hub / chọn bài đầu — không ép wizard ngay sau login.
  if (profile.profileCompleted !== true) {
    return PORTAL_MOCK_TEST_ROUTES.hub;
  }
  return fallback;
}

/**
 * Trang chủ sau đăng nhập thường (không có returnUrl).
 * Kết quả thi thử chỉ qua returnUrl / resolvePostExamPath sau nộp bài.
 */
export function resolvePostPortalLoginPath(actor: PortalAuthActor): string {
  if (actor === 'lead') return PORTAL_MOCK_TEST_ROUTES.hub;
  return '/';
}
