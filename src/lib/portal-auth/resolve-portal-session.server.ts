import { cache } from 'react';
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
  logPortalUpstream,
  summarizePortalSessionCrmPayload,
} from '@/lib/portal-ssr-debug';
import { reportStudentPortalBffError } from '@/lib/report-bff-error';
import type { PortalGuestAuthFailure } from '@/lib/portal-auth/portal-session-auth-failure';

export type PortalSessionActor = 'guest' | 'lead' | 'customer';

export type PortalSessionPayload =
  | { actor: 'guest'; authFailure?: PortalGuestAuthFailure }
  | {
      actor: 'customer';
      displayName: string;
      /** Portal account id từ CRM session (JWT đã verify) — server-only. */
      accountId?: string;
      /** Brief từ cùng GET portal/session — tránh gọi lại ở root layout. */
      customer: StudentMeCustomerBrief;
      classes: Array<{ id: number; name: string; status?: string | null }>;
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

function parseCustomerClasses(
  payload: Record<string, unknown>,
): Array<{ id: number; name: string; status?: string | null }> {
  const raw = payload.classes;
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      const id = Number(row.id);
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      const status =
        typeof row.status === 'string' || row.status === null
          ? (row.status as string | null)
          : null;
      if (!Number.isFinite(id) || !name) return null;
      return { id, name, status };
    })
    .filter(Boolean) as Array<{ id: number; name: string; status?: string | null }>;
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
    logPortalUpstream('portal_session_network', {
      method: 'GET',
      url,
      ok: false,
      status: 502,
      durationMs: Date.now() - started,
      errorMessage: error instanceof Error ? error.message : String(error),
      bodyPreview: error instanceof Error ? error.stack?.slice(0, 800) : null,
    });
    reportStudentPortalBffError(
      'mto.portal-session.network',
      error instanceof Error ? error : new Error(String(error)),
      {
        path: STUDENT_API.portalSession,
        method: 'GET',
        errorType: 'PORTAL_SESSION_NETWORK',
        details: {
          url,
          durationMs: Date.now() - started,
        },
      },
    );
    if (isUpstreamConnectionFailure(error)) throw error;
    return { actor: 'guest' };
  }

  const durationMs = Date.now() - started;
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    logPortalSsr('portal_session.http_error', {
      url,
      status: res.status,
      durationMs,
      bodyPreview: errBody.slice(0, 400),
    });
    logPortalUpstream('portal_session_http_error', {
      method: 'GET',
      url,
      status: res.status,
      ok: false,
      durationMs,
      errorMessage: `HTTP ${res.status}`,
      bodyPreview: errBody.slice(0, 800),
    });
    const isExpectedAuthFailure = res.status === 401 || res.status === 403;
    // 401/403 = JWT hết hạn / stale — lifecycle bình thường, không đẩy log platform.
    if (!isExpectedAuthFailure) {
      reportStudentPortalBffError(
        'mto.portal-session.http',
        new Error(`GET ${url} → HTTP ${res.status}`),
        {
          path: STUDENT_API.portalSession,
          method: 'GET',
          errorType: 'PORTAL_SESSION_HTTP',
          details: {
            url,
            status: res.status,
            bodyPreview: errBody.slice(0, 800),
            durationMs,
          },
        },
      );
    }
    if (isExpectedAuthFailure) {
      forcePortalLogoutCookies();
      return { actor: 'guest', authFailure: 'expired' };
    }
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
  logPortalUpstream('portal_session_ok', {
    method: 'GET',
    url,
    status: res.status,
    ok: true,
    durationMs,
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
      return { actor: 'guest', authFailure: 'expired' };
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
      classes: parseCustomerClasses(payload),
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
      return { actor: 'guest', authFailure: 'relogin_required' };
    }

    const profile = mapLeadProfile(upgraded as Record<string, unknown>);
    if (!profile) {
      logPortalSsr('portal_session.map_failed', {
        reason: 'lead_profile_invalid',
        durationMs,
      });
      forcePortalLogoutCookies();
      return { actor: 'guest', authFailure: 'expired' };
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
      return { actor: 'guest', authFailure: 'expired' };
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
  return { actor: 'guest', authFailure: 'expired' };
}

/** Dedupe CRM `/portal/session` trong cùng một RSC request. */
export const getCachedPortalSession = cache(resolvePortalSessionFromCookies);
