import type { PortalAuthActor } from '@/lib/portal-auth/portal-auth-session';
import type { LeadProfile, LeadSessionProbe, LeadTestResultSummary } from './types';
import { isLeadIdentityUpgraded } from '@/lib/portal-auth/portal-auth-session';
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
  registrationId: number;
  phone: string;
  email: string;
  password: string;
}): Promise<{ message: string }> {
  const res = await fetch('/api/auth/lead/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const data = await parseJsonMessage(res);
  if (!res.ok) {
    throw new Error(data.message ?? 'Đăng ký thất bại.');
  }
  return { message: data.message ?? 'Đã gửi email xác nhận.' };
}

export async function leadLogout(): Promise<void> {
  await fetch('/api/auth/lead/logout', { method: 'POST' });
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

export async function probeLeadSession(): Promise<LeadSessionProbe> {
  try {
    const profile = await fetchLeadProfile();
    if (isLeadIdentityUpgraded(profile)) {
      return { kind: 'student' };
    }
    return { kind: 'lead' };
  } catch (e) {
    if (e instanceof LeadPortalUnauthorizedError) return { kind: 'none' };
    return { kind: 'none' };
  }
}

export type { LeadProfile, LeadSessionProbe, LeadTestResultSummary } from './types';
