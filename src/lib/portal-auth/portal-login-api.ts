import type { PortalLoginMode } from '@/components/portal/PortalLoginModePicker';
import { STUDENT_API } from '@/lib/student-api';

/** BFF login paths — SSOT cho auth-context + tests. */
export const PORTAL_LOGIN_BFF_PATH: Record<PortalLoginMode, string> = {
  customer: '/api/auth/login',
  lead: '/api/auth/lead/login',
};

export const PORTAL_FORGOT_PASSWORD_BFF_PATH: Record<PortalLoginMode, string> = {
  customer: '/api/auth/forgot-password',
  lead: '/api/auth/lead/forgot-password',
};

export const PORTAL_RESET_PASSWORD_BFF_PATH: Record<PortalLoginMode, string> = {
  customer: '/api/auth/reset-password',
  lead: '/api/auth/lead/reset-password',
};

export const PORTAL_LOGIN_CRM_PATH: Record<PortalLoginMode, string> = {
  customer: STUDENT_API.authLogin,
  lead: STUDENT_API.authLeadLogin,
};

export function portalLoginPath(mode: PortalLoginMode): string {
  return PORTAL_LOGIN_BFF_PATH[mode];
}

export function portalForgotPasswordPath(mode: PortalLoginMode): string {
  return PORTAL_FORGOT_PASSWORD_BFF_PATH[mode];
}

export function portalResetPasswordPath(mode: PortalLoginMode): string {
  return PORTAL_RESET_PASSWORD_BFF_PATH[mode];
}
