import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';
import { buildCrmStudentUrl, unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { STUDENT_API } from '@/lib/student-api';

export type CustomerOnlineBootstrapContext = {
  customerId: number;
  omniLeadId: string;
  displayName: string;
  phoneE164: string;
  email: string | null;
};

export function parseCustomerOnlineBootstrapContext(
  raw: unknown,
): CustomerOnlineBootstrapContext | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const customerId =
    typeof o.customerId === 'number' ? o.customerId : Number(o.customerId);
  const omniLeadId =
    typeof o.omniLeadId === 'string' ? o.omniLeadId.trim() : '';
  const phoneE164 =
    typeof o.phoneE164 === 'string' ? o.phoneE164.trim() : '';
  if (!Number.isFinite(customerId) || customerId < 1 || !omniLeadId || !phoneE164) {
    return null;
  }
  const displayName =
    typeof o.displayName === 'string' && o.displayName.trim()
      ? o.displayName.trim()
      : 'Học viên';
  const email =
    typeof o.email === 'string' && o.email.trim()
      ? o.email.trim().toLowerCase()
      : null;
  return { customerId, omniLeadId, displayName, phoneE164, email };
}

/** P5c — resolve omniLeadId + SĐT trước attempt precheck / bootstrap HV. */
export async function fetchCustomerOnlineBootstrapContextSsr(): Promise<CustomerOnlineBootstrapContext | null> {
  const token = getStudentAccessTokenFromCookie()?.trim();
  const apiBase = getApiBaseUrl();
  if (!token || !apiBase) return null;

  const url = buildCrmStudentUrl(apiBase, STUDENT_API.customerOnlineBootstrapContext);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return null;
    const payload = unwrapCrmResponseBody(data) ?? data;
    return parseCustomerOnlineBootstrapContext(payload);
  } catch {
    return null;
  }
}
