/**
 * Gọi API route nội bộ — quên mật khẩu / đặt lại mật khẩu (proxy tới CRM).
 */

import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';
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
): Promise<PasswordRecoveryResult> {
  const trimmed = loginId.trim();
  const body = trimmed.includes('@')
    ? { loginId: trimmed, email: trimmed.toLowerCase() }
    : { loginId: trimmed };

  const res = await fetch(portalForgotPasswordPath(), {
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
): Promise<PasswordRecoveryResult> {
  const res = await fetch(portalResetPasswordPath(), {
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
