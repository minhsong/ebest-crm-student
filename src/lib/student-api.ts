/**
 * CRM Student Portal API – domain /api/v1/student/*
 * Base path cho mọi request từ student portal tới CRM.
 * Mở rộng: .../student/auth/*, .../student/classes/*, ...
 */

const STUDENT_API_VERSION = '1';
const STUDENT_API_PATH = 'student';

export const STUDENT_API = {
  /** Base path (không gồm domain): /api/v1/student */
  basePath: `/api/v${STUDENT_API_VERSION}/${STUDENT_API_PATH}`,
  /** Route profile: GET ?token=..., PATCH body { token, ... } */
  profile: 'profile',
  authLogin: 'auth/login',
  authGoogleLogin: 'auth/google/login',
  authGoogleLink: 'auth/google/link',
  authChangePassword: 'auth/change-password',
  authForgotPassword: 'auth/forgot-password',
  authResetPassword: 'auth/reset-password',
  authCheckLoginKey: 'auth/check-login-key',
  authLeadRegister: 'auth/lead/register',
  authRegisterByToken: 'auth/register-by-token',
  authLeadLogin: 'auth/lead/login',
  authLeadGoogleLogin: 'auth/lead/google/login',
  authLeadGoogleRegisterOrLogin: 'auth/lead/google/register-or-login',
  authLeadGoogleFinalize: 'auth/lead/google/finalize',
  authLeadGoogleMockTestFastFinalize:
    'auth/lead/google/finalize-mock-test',
  authLeadVerifyEmail: 'auth/lead/verify-email',
  authLeadResendVerification: 'auth/lead/resend-verification',
  authLeadForgotPassword: 'auth/lead/forgot-password',
  authLeadResetPassword: 'auth/lead/reset-password',
  authLeadChangePassword: 'auth/lead/change-password',
  leadMe: 'lead/me',
  leadCompleteProfile: 'lead/me/complete-profile',
  leadTestResults: 'lead/me/test-results',
  leadOfflineRegistration: 'lead/mock-test/offline-registrations',
  customerOfflineRegistration: 'me/mock-test/offline-registrations',
  /** UPA unified — CRM quyết định actor từ JWT đã validate. */
  portalSession: 'portal/session',
  portalOfflineRegistration: 'portal/mock-test/offline-registrations',
  customerOnlineBootstrapContext: 'me/mock-test-online/bootstrap-context',
  customerOnlineAttemptStatus: 'me/mock-test-online/attempt-status',
  /** @deprecated Dùng `portalExplore` — marketing Mongo đã gỡ. */
  portalMarketing: 'portal/marketing',
  portalExplore: 'portal/explore',
  portalCourseCatalog: 'portal/course-catalog',
  portalSiteLinks: 'portal/site-links',
  portalRecommendations: 'portal/recommendations',
  mockTestResults: 'me/mock-test-results',
  /** Knowledge base — proxy Next: `/api/qa`, `/api/qa/by-slug/[slug]` */
  qa: 'qa',
} as const;

/** Build full URL: GET profile với token */
export function getProfileUrl(apiBaseUrl: string, token: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}${STUDENT_API.basePath}/${STUDENT_API.profile}?token=${encodeURIComponent(token)}`;
}

/** Build full URL: PATCH profile */
export function patchProfileUrl(apiBaseUrl: string): string {
  const base = apiBaseUrl.replace(/\/$/, '');
  return `${base}${STUDENT_API.basePath}/${STUDENT_API.profile}`;
}
