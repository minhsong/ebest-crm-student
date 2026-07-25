import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy.shared';

export type LoginKeyPrecheckResult = {
  available: boolean;
  kind?: 'email' | 'phone';
  code?: string;
  action?: 'login' | 'contact_support';
};

function parsePrecheckPayload(raw: unknown): LoginKeyPrecheckResult {
  const payload = (unwrapCrmResponseBody(raw) ?? raw) as Record<string, unknown>;
  if (!payload || typeof payload !== 'object') {
    return { available: false, code: 'EMAIL_ALREADY_IN_SYSTEM', action: 'login' };
  }
  return {
    available: payload.available === true,
    kind:
      payload.kind === 'phone'
        ? 'phone'
        : payload.kind === 'email'
          ? 'email'
          : undefined,
    code: typeof payload.code === 'string' ? payload.code : undefined,
    action:
      payload.action === 'contact_support'
        ? 'contact_support'
        : payload.action === 'login'
          ? 'login'
          : undefined,
  };
}

async function checkOne(input: {
  email?: string;
  phone?: string;
  excludeCustomerId?: number;
}): Promise<LoginKeyPrecheckResult> {
  const qs = new URLSearchParams();
  const email = input.email?.trim();
  const phone = input.phone?.trim();
  if (email) qs.set('email', email);
  if (phone) qs.set('phone', phone);
  if (input.excludeCustomerId && input.excludeCustomerId > 0) {
    qs.set('excludeCustomerId', String(input.excludeCustomerId));
  }
  if (!email && !phone) {
    return { available: true };
  }

  const res = await fetch(`/api/auth/check-login-key?${qs}`, {
    cache: 'no-store',
  });
  const raw = await res.json().catch(() => ({}));
  const data = parsePrecheckPayload(raw);
  if (!res.ok) {
    return {
      available: false,
      kind: email ? 'email' : 'phone',
      code: data.code ?? 'EMAIL_ALREADY_IN_SYSTEM',
      action: data.action === 'contact_support' ? 'contact_support' : 'login',
    };
  }
  return data;
}

/**
 * W10 — debounced pre-check (complete-profile / lead register).
 * Login key = **email** only (PO-D32). `phone` ignored for uniqueness.
 */
export async function checkLoginKeyAvailability(input: {
  email?: string;
  phone?: string;
  excludeCustomerId?: number;
}): Promise<LoginKeyPrecheckResult> {
  const email = input.email?.trim();
  void input.phone;
  if (!email) {
    return { available: true, kind: 'phone' };
  }

  const emailResult = await checkOne({
    email,
    excludeCustomerId: input.excludeCustomerId,
  });
  if (!emailResult.available) return emailResult;

  return {
    available: true,
    kind: 'email',
  };
}

export async function fetchExamFunnelHint(
  registrationId: number,
): Promise<{ hideLeadRegister: boolean }> {
  if (!Number.isFinite(registrationId) || registrationId < 1) {
    return { hideLeadRegister: false };
  }
  const res = await fetch(
    `/api/public/mock-test-online/funnel-hint?registrationId=${registrationId}`,
    { cache: 'no-store' },
  );
  const data = (await res.json().catch(() => ({}))) as {
    hideLeadRegister?: boolean;
  };
  const payload = (unwrapCrmResponseBody(data) ?? data) as {
    hideLeadRegister?: boolean;
  };
  return { hideLeadRegister: payload.hideLeadRegister === true };
}
