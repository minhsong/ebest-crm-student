/**
 * Gọi API route nội bộ — quên mật khẩu / đặt lại mật khẩu (proxy tới CRM).
 */

import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';

export type PasswordRecoveryResult = {
  ok: boolean;
  status: number;
  message?: string;
};

export async function postForgotPassword(
  email: string,
): Promise<PasswordRecoveryResult> {
  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
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
  const res = await fetch('/api/auth/reset-password', {
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
