/**
 * Server-only: cookie helpers (next/headers). Không import từ Client Component.
 */
import {
  clearPortalAccessTokenCookie,
  setPortalAccessTokenCookie,
} from '@/lib/portal-auth-cookie';
import type {
  LeadMeCrmPayload,
  PortalAuthActor,
} from '@/lib/portal-auth/portal-auth-session';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';

/** SSOT set cookie portal — một cookie `portal_at` (UPA-D11). Actor chỉ để typing caller. */
export function setPortalSessionCookie(_actor: PortalAuthActor, token: string) {
  setPortalAccessTokenCookie(token);
}

/** Alias rõ nghĩa — mọi auth success (password/Google/register) ghi cùng cookie. */
export function applyPortalSessionAccessToken(token: string): void {
  setPortalAccessTokenCookie(token);
}

export function clearPortalSessionCookie(_actor: PortalAuthActor) {
  clearPortalAccessTokenCookie();
}

/**
 * Mint Lead JWT vào `portal_at` chỉ khi chưa có phiên Customer.
 * Tránh demote HV → Lead sau Zalo / confirm email (MTO × UPA).
 */
export async function setLeadPortalSessionCookieIfSafe(
  accessToken: string,
): Promise<'set' | 'skipped_customer' | 'skipped_empty'> {
  const token = accessToken?.trim() ?? '';
  if (!token) return 'skipped_empty';

  const session = await resolvePortalSessionFromCookies();
  if (session.actor === 'customer') {
    return 'skipped_customer';
  }
  setPortalSessionCookie('lead', token);
  return 'set';
}

/**
 * Sau convert (UPA-D15/M3): CRM báo `reLoginRequired` — **không** silent mint cookie.
 * Xóa cookie portal hiện tại (Lead JWT không còn hợp lệ cho layout Lead).
 */
export function applyLeadIdentityUpgradeCookies(
  payload: LeadMeCrmPayload,
): LeadMeCrmPayload {
  const upgrade = payload.identityUpgrade;
  if (!upgrade?.available) {
    return payload;
  }
  clearPortalAccessTokenCookie();
  if (upgrade.accessToken) {
    return {
      ...payload,
      identityUpgrade: {
        ...upgrade,
        accessToken: undefined,
        reLoginRequired: true,
        applied: false,
      },
    };
  }
  return {
    ...payload,
    identityUpgrade: {
      ...upgrade,
      reLoginRequired: upgrade.reLoginRequired !== false,
      applied: false,
    },
  };
}

/** Xóa cookie identity portal (logout SSOT). */
export function clearAllPortalAuthCookies(): void {
  clearPortalAccessTokenCookie();
}
