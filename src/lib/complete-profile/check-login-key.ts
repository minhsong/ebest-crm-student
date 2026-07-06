export type LoginKeyPrecheckResult = {
  available: boolean;
  kind?: 'email' | 'phone';
  code?: string;
  action?: 'login' | 'contact_support';
};

/** W10 — debounced pre-check (complete-profile). */
export async function checkLoginKeyAvailability(input: {
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
  const data = (await res.json().catch(() => ({}))) as LoginKeyPrecheckResult;
  if (!res.ok) {
    return {
      available: false,
      code: typeof data.code === 'string' ? data.code : 'EMAIL_ALREADY_IN_SYSTEM',
      action: data.action === 'contact_support' ? 'contact_support' : 'login',
    };
  }
  return data;
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
  return { hideLeadRegister: data.hideLeadRegister === true };
}
