/**
 * Server-only: cookie helpers (next/headers). Không import từ Client Component.
 */
import {
  clearLeadAccessTokenCookie,
  setLeadAccessTokenCookie,
} from '@/lib/lead-auth-cookie';
import {
  clearStudentAccessTokenCookie,
  setStudentAccessTokenCookie,
} from '@/lib/auth-cookie';
import type {
  LeadMeCrmPayload,
  PortalAuthActor,
} from '@/lib/portal-auth/portal-auth-session';

/** SSOT set cookie portal theo actor (PI-D2 một cookie active). */
export function setPortalSessionCookie(actor: PortalAuthActor, token: string) {
  const v = token?.trim() ?? '';
  if (!v) return;
  if (actor === 'lead') {
    setLeadAccessTokenCookie(v);
    clearStudentAccessTokenCookie();
  } else {
    setStudentAccessTokenCookie(v);
    clearLeadAccessTokenCookie();
  }
}

export function clearPortalSessionCookie(actor: PortalAuthActor) {
  if (actor === 'lead') {
    clearLeadAccessTokenCookie();
  } else {
    clearStudentAccessTokenCookie();
  }
}

/**
 * Silent upgrade: đổi cookie lead → customer khi CRM trả JWT HV (PI-D3, PI-D11).
 * Trả payload đã gắn `identityUpgrade.applied`.
 */
export function applyLeadIdentityUpgradeCookies(
  payload: LeadMeCrmPayload,
): LeadMeCrmPayload {
  const upgrade = payload.identityUpgrade;
  if (upgrade?.available && upgrade.accessToken) {
    setPortalSessionCookie('customer', upgrade.accessToken);
    return {
      ...payload,
      identityUpgrade: { ...upgrade, applied: true },
    };
  }
  return payload;
}

/** Xóa cả cookie identity portal (logout SSOT). */
export function clearAllPortalAuthCookies(): void {
  clearStudentAccessTokenCookie();
  clearLeadAccessTokenCookie();
}
