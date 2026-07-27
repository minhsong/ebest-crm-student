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
import {
  logPortalSsr,
  logPortalSsrError,
  summarizePortalSessionCrmPayload,
} from '@/lib/portal-ssr-debug';

export type PortalSessionActor = 'guest' | 'lead' | 'customer';

export type PortalSessionPayload =
  | { actor: 'guest' }
  | {
      actor: 'customer';
      displayName: string;
      /** Portal account id từ CRM session (JWT đã verify) — server-only. */
      accountId?: string;
      /** Brief từ cùng GET portal/session — tránh gọi lại ở root layout. */
      customer: StudentMeCustomerBrief;
    }
  | {
      actor: 'lead';
      displayName: string;
      omniLeadId: string;
      /** Portal account id từ CRM session (JWT đã verify) — server-only. */
      accountId: string;
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

/** accountId từ CRM portal/session (JWT đã verify) — không decode cookie JWT ở BFF. */
function parsePortalSessionAccountId(
  payload: Record<string, unknown>,
): string | null {
  const raw = payload.accountId;
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 1) {
    return String(Math.trunc(raw));
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    const n = Number(trimmed);
    if (trimmed && Number.isFinite(n) && n >= 1) return String(Math.trunc(n));
  }
  return null;
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
  if (!token) {
    logPortalSsr('portal_session.skip', { reason: 'no_cookie' });
    return { actor: 'guest' };
  }

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    logPortalSsr('portal_session.skip', { reason: 'CRM_API_URL_missing' });
    return { actor: 'guest' };
  }

  const url = buildCrmStudentUrl(apiBase, STUDENT_API.portalSession);
  const started = Date.now();
  logPortalSsr('portal_session.request', {
    method: 'GET',
    url,
    hasBearer: true,
    tokenLen: token.length,
  });

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch (error) {
    logPortalSsrError('portal_session.fetch_failed', error, {
      url,
      durationMs: Date.now() - started,
      connectionFailure: isUpstreamConnectionFailure(error),
    });
    if (isUpstreamConnectionFailure(error)) throw error;
    return { actor: 'guest' };
  }

  const durationMs = Date.now() - started;
  if (!res.ok) {
    logPortalSsr('portal_session.http_error', {
      url,
      status: res.status,
      durationMs,
    });
    if (res.status === 401) forcePortalLogoutCookies();
    return { actor: 'guest' };
  }

  const data = await res.json().catch(() => ({}));
  const payload = (unwrapCrmResponseBody(data) ?? data) as Record<
    string,
    unknown
  >;
  const actor = payload.actor;
  logPortalSsr('portal_session.crm_ok', {
    url,
    status: res.status,
    durationMs,
    summary: summarizePortalSessionCrmPayload(payload),
  });

  if (actor === 'customer') {
    const customer = parseStudentMeCustomerBrief(
      (payload as { customer?: unknown }).customer ?? payload,
    );
    if (!customer) {
      logPortalSsr('portal_session.map_failed', {
        reason: 'customer_brief_invalid',
        durationMs,
      });
      forcePortalLogoutCookies();
      return { actor: 'guest' };
    }
    const accountId = parsePortalSessionAccountId(payload) ?? undefined;
    logPortalSsr('portal_session.resolved', {
      actor: 'customer',
      accountId: accountId ?? null,
      customerId: customer.id,
      durationMs,
    });
    return {
      actor: 'customer',
      displayName: customer.fullName?.trim() || 'Học viên',
      ...(accountId ? { accountId } : {}),
      customer,
    };
  }

  if (actor === 'lead') {
    const upgraded = applyLeadIdentityUpgradeCookies(
      payload as LeadMeCrmPayload & Record<string, unknown>,
    );

    if (isLeadIdentityUpgraded(upgraded)) {
      logPortalSsr('portal_session.resolved', {
        actor: 'guest',
        reason: 'identity_upgrade_relogin',
        durationMs,
      });
      return { actor: 'guest' };
    }

    const profile = mapLeadProfile(upgraded as Record<string, unknown>);
    if (!profile) {
      logPortalSsr('portal_session.map_failed', {
        reason: 'lead_profile_invalid',
        durationMs,
      });
      forcePortalLogoutCookies();
      return { actor: 'guest' };
    }

    const accountId =
      parsePortalSessionAccountId(upgraded as Record<string, unknown>) ||
      parsePortalSessionAccountId(payload) ||
      (profile.id >= 1 ? String(profile.id) : '');
    if (!accountId) {
      logPortalSsr('portal_session.map_failed', {
        reason: 'lead_account_id_missing',
        durationMs,
      });
      forcePortalLogoutCookies();
      return { actor: 'guest' };
    }

    const displayName =
      profile.displayName?.trim() ||
      profile.phoneE164?.trim() ||
      profile.email?.trim() ||
      'Thí sinh';

    logPortalSsr('portal_session.resolved', {
      actor: 'lead',
      accountId,
      omniLeadId: profile.omniLeadId,
      profileCompleted: profile.profileCompleted === true,
      durationMs,
    });
    return {
      actor: 'lead',
      displayName,
      omniLeadId: profile.omniLeadId,
      accountId,
      profile,
    };
  }

  logPortalSsr('portal_session.map_failed', {
    reason: 'unknown_actor',
    actor: typeof actor === 'string' ? actor : null,
    durationMs,
  });
  forcePortalLogoutCookies();
  return { actor: 'guest' };
}
