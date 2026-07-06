/**
 * Gọi API route nội bộ — quên mật khẩu / đặt lại mật khẩu (proxy tới CRM).
 */

import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';
import type { PortalLoginMode } from '@/components/portal/PortalLoginModePicker';
import {
  portalForgotPasswordPath,
  portalResetPasswordPath,
} from '@/lib/portal-auth/portal-login-api';

export type PasswordRecoveryResult = {
  ok: boolean;
  status: number;
  message?: string;
};

export async function postForgotPassword(
  loginId: string,
  mode: PortalLoginMode = 'customer',
): Promise<PasswordRecoveryResult> {
  const body =
    mode === 'lead'
      ? { loginId: loginId.trim() }
      : { email: loginId.trim().toLowerCase() };

  const res = await fetch(portalForgotPasswordPath(mode), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    message: getMessageFromClientApiJson(data),
  };
}

export async function postResetPassword(
  token: string,
  password: string,
  mode: PortalLoginMode = 'customer',
): Promise<PasswordRecoveryResult> {
  const res = await fetch(portalResetPasswordPath(mode), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    message: getMessageFromClientApiJson(data),
  };
}
