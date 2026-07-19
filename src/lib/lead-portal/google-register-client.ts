import { getMessageFromClientApiJson } from '@/lib/parse-client-api-json';
import type { PortalGoogleAuthClientResult } from '@ebest/crm-api-types/student/portal';

export type GoogleRegisterFlowResult = PortalGoogleAuthClientResult;

export function parseGoogleRegisterFlow(
  data: Record<string, unknown>,
): GoogleRegisterFlowResult | null {
  const flow = typeof data.flow === 'string' ? data.flow : '';
  if (flow === 'session') {
    const actor =
      data.actor === 'customer' || data.actor === 'lead' ? data.actor : null;
    if (!actor) return null;
    const accountRaw =
      data.account && typeof data.account === 'object'
        ? (data.account as Record<string, unknown>)
        : null;
    return {
      flow: 'session',
      actor,
      expiresIn:
        typeof data.expiresIn === 'string' ? data.expiresIn : undefined,
      account: accountRaw
        ? {
            displayName:
              typeof accountRaw.displayName === 'string' ||
              accountRaw.displayName === null
                ? (accountRaw.displayName as string | null)
                : undefined,
            email:
              typeof accountRaw.email === 'string'
                ? accountRaw.email
                : undefined,
            phoneE164:
              typeof accountRaw.phoneE164 === 'string' ||
              accountRaw.phoneE164 === null
                ? (accountRaw.phoneE164 as string | null)
                : undefined,
            emailVerifiedAt:
              typeof accountRaw.emailVerifiedAt === 'string' ||
              accountRaw.emailVerifiedAt === null
                ? (accountRaw.emailVerifiedAt as string | null)
                : undefined,
            profileCompleted: accountRaw.profileCompleted === true,
          }
        : undefined,
    };
  }
  if (flow === 'register_ticket') {
    const ticket = typeof data.ticket === 'string' ? data.ticket : '';
    const prefillRaw =
      data.prefill && typeof data.prefill === 'object'
        ? (data.prefill as Record<string, unknown>)
        : {};
    if (!ticket) return null;
    return {
      flow: 'register_ticket',
      ticket,
      prefill: {
        email: typeof prefillRaw.email === 'string' ? prefillRaw.email : '',
        ...(typeof prefillRaw.displayName === 'string'
          ? { displayName: prefillRaw.displayName }
          : {}),
      },
    };
  }
  if (flow === 'password_link') {
    const ticket = typeof data.ticket === 'string' ? data.ticket : '';
    const actor =
      data.actor === 'customer' || data.actor === 'lead' ? data.actor : null;
    if (!ticket || !actor) return null;
    return {
      flow: 'password_link',
      actor,
      ticket,
      message:
        typeof data.message === 'string'
          ? data.message
          : 'Nhập mật khẩu để liên kết Google.',
    };
  }
  if (flow === 'complete_profile') {
    const url =
      typeof data.completeProfileUrl === 'string'
        ? data.completeProfileUrl
        : '';
    if (!url) return null;
    return {
      flow: 'complete_profile',
      actor: 'customer',
      completeProfileUrl: url,
      reason:
        data.reason === 'needs_password'
          ? 'needs_password'
          : 'incomplete_profile',
    };
  }
  if (flow === 'conflict') {
    return {
      flow: 'conflict',
      code: typeof data.code === 'string' ? data.code : undefined,
      message:
        typeof data.message === 'string'
          ? data.message
          : 'Email đã được sử dụng trên hệ thống.',
      action:
        data.action === 'login' || data.action === 'use_other_email'
          ? data.action
          : undefined,
    };
  }
  return null;
}

async function postJson(
  url: string,
  body: Record<string, unknown>,
): Promise<GoogleRegisterFlowResult> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = new Error(
      getMessageFromClientApiJson(data) ??
        'Thao tác Google thất bại. Vui lòng thử lại.',
    ) as Error & { action?: string; code?: string };
    if (typeof data.action === 'string') err.action = data.action;
    if (typeof data.code === 'string') err.code = data.code;
    throw err;
  }
  const parsed = parseGoogleRegisterFlow(data);
  if (!parsed) {
    throw new Error('Phản hồi đăng ký Google không hợp lệ.');
  }
  return parsed;
}

export function googleRegisterOrLogin(
  idToken: string,
  intent?: 'mock_test_fast',
): Promise<GoogleRegisterFlowResult> {
  return postJson('/api/auth/lead/google/register-or-login', {
    idToken,
    ...(intent ? { intent } : {}),
  });
}

export function googleFinalize(input: {
  ticket: string;
  password: string;
  phone?: string;
  displayName?: string;
  registrationId?: number;
}): Promise<GoogleRegisterFlowResult> {
  return postJson('/api/auth/lead/google/finalize', { ...input });
}

export function googleFinalizeMockTestFast(input: {
  ticket: string;
  displayName: string;
  phone?: string;
  consentMarketing: true;
}): Promise<GoogleRegisterFlowResult> {
  return postJson('/api/auth/lead/google/finalize-mock-test', { ...input });
}
