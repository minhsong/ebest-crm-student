import { getApiBaseUrl } from '@/lib/env';
import {
  forcePortalLogoutCookies,
  getPortalAccessTokenFromCookie,
} from '@/lib/portal-auth-cookie';
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
      /** Brief từ cùng GET portal/session — tránh gọi lại ở root layout. */
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

/**
 * Cookie-first resolve — SSOT GET CRM `/student/portal/session`.
 * Actor do CRM quyết định sau verify JWT; BFF không decode accountType.
 *
 * An toàn khi gọi từ RSC (layout/page): đọc cookie + CRM; clear cookie invalid
 * chỉ thực sự ghi được trong Route Handler (force logout best-effort no-op ở RSC).
 */
export async function resolvePortalSessionFromCookies(): Promise<PortalSessionPayload> {
  const token = getPortalAccessTokenFromCookie()?.trim() ?? '';
  if (!token) return { actor: 'guest' };

  const apiBase = getApiBaseUrl();
  if (!apiBase) return { actor: 'guest' };

  let res: Response;
  try {
    res = await fetch(buildCrmStudentUrl(apiBase, STUDENT_API.portalSession), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (error) {
    if (isUpstreamConnectionFailure(error)) throw error;
    return { actor: 'guest' };
  }

  if (!res.ok) {
    if (res.status === 401) forcePortalLogoutCookies();
    return { actor: 'guest' };
  }

  const data = await res.json().catch(() => ({}));
  const payload = (unwrapCrmResponseBody(data) ?? data) as Record<
    string,
    unknown
  >;
  const actor = payload.actor;

  if (actor === 'customer') {
    const customer = parseStudentMeCustomerBrief(
      (payload as { customer?: unknown }).customer ?? payload,
    );
    if (!customer) {
      forcePortalLogoutCookies();
      return { actor: 'guest' };
    }
    return {
      actor: 'customer',
      displayName: customer.fullName?.trim() || 'Học viên',
      customer,
    };
  }

  if (actor === 'lead') {
    const upgraded = applyLeadIdentityUpgradeCookies(
      payload as LeadMeCrmPayload & Record<string, unknown>,
    );

    if (isLeadIdentityUpgraded(upgraded)) {
      return { actor: 'guest' };
    }

    const profile = mapLeadProfile(upgraded as Record<string, unknown>);
    if (!profile) {
      forcePortalLogoutCookies();
      return { actor: 'guest' };
    }

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

  forcePortalLogoutCookies();
  return { actor: 'guest' };
}
