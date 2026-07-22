import type { PortalAuthActor } from '@/lib/portal-auth/portal-auth-session';
import type { LeadProfile, LeadSessionProbe, LeadTestResultSummary } from './types';
import { fetchClientPortalSession } from '@/lib/portal-auth/portal-session.client';
import { portalLogoutClient } from '@/lib/portal-auth/portal-session.client';
import { LeadPortalUnauthorizedError } from './errors';

async function parseJsonMessage(res: Response): Promise<{ message?: string }> {
  return (await res.json().catch(() => ({}))) as { message?: string };
}

async function parseLoginResponse(res: Response): Promise<{
  message?: string;
  actor?: PortalAuthActor;
}> {
  return (await res.json().catch(() => ({}))) as {
    message?: string;
    actor?: PortalAuthActor;
  };
}

export async function leadLogin(
  loginId: string,
  password: string,
): Promise<{ actor: PortalAuthActor }> {
  const res = await fetch('/api/auth/lead/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId, password }),
  });
  const data = await parseLoginResponse(res);
  if (!res.ok) {
    throw new Error(data.message ?? 'Đăng nhập thất bại.');
  }
  return { actor: data.actor === 'lead' ? 'lead' : 'customer' };
}

export async function leadRegister(input: {
  phone: string;
  email: string;
  password: string;
  /** Có = tạo tài khoản gắn đăng ký thi; không = đăng ký tự phục vụ */
  registrationId?: number;
  displayName?: string;
}): Promise<{ message: string; emailVerificationSent: boolean }> {
  const body: Record<string, unknown> = {
    phone: input.phone,
    email: input.email,
    password: input.password,
  };
  if (
    typeof input.registrationId === 'number' &&
    Number.isFinite(input.registrationId) &&
    input.registrationId >= 1
  ) {
    body.registrationId = input.registrationId;
  }
  if (input.displayName?.trim()) {
    body.displayName = input.displayName.trim();
  }

  const res = await fetch('/api/auth/lead/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    emailVerificationSent?: boolean;
    code?: string;
    errorCode?: string;
    action?: 'login' | 'contact_support';
  };
  if (!res.ok) {
    const err = new Error(data.message ?? 'Đăng ký thất bại.') as Error & {
      code?: string;
      action?: 'login' | 'contact_support';
    };
    err.code = data.code ?? data.errorCode;
    if (data.action === 'login' || data.action === 'contact_support') {
      err.action = data.action;
    } else if (
      res.status === 409 ||
      String(err.code ?? '').includes('ALREADY') ||
      /đã|trùng|tồn tại|conflict|already/i.test(err.message)
    ) {
      err.action = 'login';
    }
    throw err;
  }
  return {
    message:
      data.message ??
      'Đã tạo tài khoản. Vui lòng kiểm tra email để xác nhận trước khi đăng nhập.',
    emailVerificationSent: data.emailVerificationSent === true,
  };
}

export async function leadResendEmailVerification(
  loginId: string,
): Promise<{ message: string; sent: boolean }> {
  const res = await fetch('/api/auth/lead/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginId: loginId.trim() }),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string;
    sent?: boolean;
  };
  if (!res.ok) {
    throw new Error(data.message ?? 'Không gửi lại được email xác nhận.');
  }
  return {
    message: data.message ?? 'Đã xử lý yêu cầu gửi lại email.',
    sent: data.sent !== false,
  };
}

export async function leadLogout(): Promise<void> {
  await portalLogoutClient();
}

export async function fetchLeadProfile(): Promise<LeadProfile> {
  const res = await fetch('/api/lead/me', { cache: 'no-store' });
  if (res.status === 401) {
    throw new LeadPortalUnauthorizedError();
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data?.message === 'string' ? data.message : 'Không tải được hồ sơ.',
    );
  }
  return data as LeadProfile;
}

/** Đánh dấu hoàn thiện hồ sơ sau đăng ký cơ bản — mở layout portal. */
export async function completeLeadProfile(input: {
  password?: string;
  phone?: string;
  displayName?: string;
  tagIds?: number[];
  universityTagId?: number;
  universityOther?: string;
  consultationNote?: string;
  expectedScore?: number;
}): Promise<LeadProfile> {
  const res = await fetch('/api/lead/me/complete-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res.status === 401) {
    throw new LeadPortalUnauthorizedError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.message === 'string'
        ? data.message
        : 'Không hoàn thiện được hồ sơ.',
    );
  }
  return data as LeadProfile;
}

export async function fetchLeadTestResults(): Promise<LeadTestResultSummary[]> {
  const res = await fetch('/api/lead/me/test-results', { cache: 'no-store' });
  if (res.status === 401) {
    throw new LeadPortalUnauthorizedError();
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      typeof data?.message === 'string' ? data.message : 'Không tải được kết quả.',
    );
  }
  return Array.isArray(data) ? data : (data.items ?? []);
}

/**
 * Probe phiên portal (lead | customer | none).
 * SSOT: `/api/portal/session` — không dual-probe lead me trước.
 */
export async function probeLeadSession(): Promise<LeadSessionProbe> {
  const session = await fetchClientPortalSession();
  if (session.actor === 'customer') return { kind: 'customer' };
  if (session.actor === 'lead') return { kind: 'lead' };
  return { kind: 'none' };
}

export type { LeadProfile, LeadSessionProbe, LeadTestResultSummary } from './types';
