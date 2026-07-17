import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';
import { getLeadAccessTokenFromCookie } from '@/lib/lead-auth-cookie';
import { STUDENT_API } from '@/lib/student-api';
import { buildCrmStudentUrl, unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import {
  isLeadIdentityUpgraded,
  type LeadMeCrmPayload,
} from '@/lib/portal-auth/portal-auth-session';
import { applyLeadIdentityUpgradeCookies } from '@/lib/portal-auth/portal-auth-session.server';
import type { LeadProfile } from '@/lib/lead-portal/types';
import { mapLeadMeForClient } from '@/lib/lead-portal/lead-profile-client';
import {
  parseStudentMeCustomerBrief,
  type StudentMeCustomerBrief,
} from '@/lib/parse-student-me-customer';
import { isUpstreamConnectionFailure } from '@/lib/student-safe-errors';

export type PortalSessionActor = 'guest' | 'lead' | 'customer';

export type PortalSessionPayload =
  | { actor: 'guest' }
  | {
      actor: 'customer';
      displayName: string;
      /** Brief từ cùng GET /student/me — tránh gọi lại ở root layout. */
      customer: StudentMeCustomerBrief;
    }
  | {
      actor: 'lead';
      displayName: string;
      omniLeadId: string;
      profile: LeadProfile;
    };

function mapLeadProfile(raw: Record<string, unknown>): LeadProfile | null {
  const account = (raw.leadAccount ?? raw.account ?? raw) as Record<
    string,
    unknown
  >;
  const omniLeadId =
    typeof account.omniLeadId === 'string'
      ? account.omniLeadId.trim()
      : typeof raw.omniLeadId === 'string'
        ? raw.omniLeadId.trim()
        : '';
  if (!omniLeadId) return null;

  const mapped = mapLeadMeForClient({ ...raw, ...account, omniLeadId });
  return { ...mapped, omniLeadId };
}

async function fetchCustomerSession(): Promise<PortalSessionPayload | null> {
  const token = getStudentAccessTokenFromCookie();
  if (!token) return null;

  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;

  const url = `${apiBase.replace(/\/$/, '')}/api/v1/student/me`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (error) {
    if (isUpstreamConnectionFailure(error)) throw error;
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json().catch(() => ({}));
  const payload = unwrapCrmResponseBody(data) ?? data;
  const customer = parseStudentMeCustomerBrief(
    (payload as { customer?: unknown })?.customer ?? payload,
  );
  if (!customer) return null;

  return {
    actor: 'customer',
    displayName: customer.fullName?.trim() || 'Học viên',
    customer,
  };
}

async function fetchLeadSession(): Promise<PortalSessionPayload | null> {
  const token = getLeadAccessTokenFromCookie();
  if (!token) return null;

  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;

  const url = buildCrmStudentUrl(apiBase, STUDENT_API.leadMe);
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (error) {
    if (isUpstreamConnectionFailure(error)) throw error;
    return null;
  }
  if (!res.ok) return null;

  const data = await res.json().catch(() => ({}));
  const raw = (unwrapCrmResponseBody(data) ?? data) as LeadMeCrmPayload &
    Record<string, unknown>;
  const upgraded = applyLeadIdentityUpgradeCookies(raw);

  if (isLeadIdentityUpgraded(upgraded)) {
    const customerToken = getStudentAccessTokenFromCookie();
    if (customerToken) {
      return fetchCustomerSession();
    }
    return { actor: 'guest' };
  }

  const profile = mapLeadProfile(upgraded as Record<string, unknown>);
  if (!profile) return null;

  const displayName =
    profile.displayName?.trim() ||
    profile.phoneE164?.trim() ||
    profile.email?.trim() ||
    'Thí sinh';

  return {
    actor: 'lead',
    displayName,
    omniLeadId: profile.omniLeadId,
    profile,
  };
}

/** Cookie-first resolve — SSOT cho GET /api/portal/session (LP-D8). */
export async function resolvePortalSessionFromCookies(): Promise<PortalSessionPayload> {
  const customer = await fetchCustomerSession();
  if (customer) return customer;

  const lead = await fetchLeadSession();
  if (lead) return lead;

  return { actor: 'guest' };
}
