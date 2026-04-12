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
