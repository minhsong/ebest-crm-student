import type { PortalAuthActor } from '@/lib/portal-auth/portal-auth-session';
import type { LeadSessionProbe } from '@/lib/lead-portal/types';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

export const PORTAL_MOCK_TEST_RESULTS_ROUTES = {
  lead: PORTAL_MOCK_TEST_ROUTES.results,
  student: PORTAL_MOCK_TEST_ROUTES.results,
  /** Unified login (customer → lead fallback). */
  login: '/login',
} as const;

/** Gate sau đăng ký cơ bản — bắt buộc trước layout lead đầy đủ. */
export const LEAD_COMPLETE_PROFILE_PATH = '/lead/complete-profile' as const;

export function resolveMockTestResultsPath(probe: LeadSessionProbe): string {
  if (probe.kind === 'student') return PORTAL_MOCK_TEST_RESULTS_ROUTES.student;
  if (probe.kind === 'lead') return PORTAL_MOCK_TEST_RESULTS_ROUTES.lead;
  return PORTAL_MOCK_TEST_RESULTS_ROUTES.login;
}

export function resolvePostLeadLoginPath(
  profile: {
    identityUpgrade?: { applied?: boolean };
    profileCompleted?: boolean;
  },
  fallback: string = PORTAL_MOCK_TEST_RESULTS_ROUTES.lead,
): string {
  if (profile.identityUpgrade?.applied) {
    return PORTAL_MOCK_TEST_RESULTS_ROUTES.student;
  }
  if (profile.profileCompleted === false) {
    return LEAD_COMPLETE_PROFILE_PATH;
  }
  return fallback;
}

/** Đường dẫn sau đăng nhập unified / lead login. */
export function resolvePostPortalLoginPath(actor: PortalAuthActor): string {
  if (actor === 'lead') return PORTAL_MOCK_TEST_RESULTS_ROUTES.lead;
  return PORTAL_MOCK_TEST_RESULTS_ROUTES.student;
}

export function resolvePostProbePath(probe: LeadSessionProbe): string | null {
  if (probe.kind === 'none') return null;
  return resolveMockTestResultsPath(probe);
}
