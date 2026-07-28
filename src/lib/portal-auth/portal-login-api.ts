import { STUDENT_API } from '@/lib/student-api';

/** BFF password login — một path duy nhất. */
export const PORTAL_LOGIN_BFF_PATH = '/api/auth/login' as const;

/** BFF quên / đặt lại mật khẩu — thống nhất (alias lead vẫn proxy cùng CRM). */
export const PORTAL_FORGOT_PASSWORD_BFF_PATH =
  '/api/auth/forgot-password' as const;

export const PORTAL_RESET_PASSWORD_BFF_PATH =
  '/api/auth/reset-password' as const;

export const PORTAL_LOGIN_CRM_PATH = STUDENT_API.authLogin;

export function portalLoginPath(): string {
  return PORTAL_LOGIN_BFF_PATH;
}

export function portalForgotPasswordPath(): string {
  return PORTAL_FORGOT_PASSWORD_BFF_PATH;
}

export function portalResetPasswordPath(): string {
  return PORTAL_RESET_PASSWORD_BFF_PATH;
}
