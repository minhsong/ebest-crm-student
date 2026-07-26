import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import type { PortalSessionPayload } from '@/lib/portal-auth/resolve-portal-session.server';
import { fetchCustomerOnlineBootstrapContextSsr } from '@/features/portal-mock-test/server/fetch-customer-bootstrap-context.server';

/**
 * Identity MTO đã resolve server-side từ cookie session.
 * Client UI không được tự gửi omniLeadId / customerId.
 * SSOT: docs/PORTAL_BFF_AUTH_AND_IDENTITY_REUSE_SPEC.md
 */
export type MtoCallerIdentity = {
  actor: 'lead' | 'customer';
  omniLeadId: string;
  accountId?: string;
  customerId?: number;
  phoneE164?: string;
  displayName?: string;
};

export type ResolveMtoCallerIdentityResult =
  | { ok: true; identity: MtoCallerIdentity }
  | { ok: false; reason: 'guest' | 'identity_unavailable' };

/**
 * Tái sử dụng session đã resolve (tránh gọi portal/session lần 2 trong cùng handler).
 * Customer: ưu tiên omniLeadId/phone trên portal/session; chỉ fallback bootstrap khi thiếu omni.
 */
export async function resolveMtoCallerIdentityFromSession(
  session: PortalSessionPayload,
): Promise<ResolveMtoCallerIdentityResult> {
  if (session.actor === 'guest') {
    return { ok: false, reason: 'guest' };
  }

  if (session.actor === 'lead') {
    const omniLeadId = session.omniLeadId?.trim() || '';
    if (!omniLeadId) {
      return { ok: false, reason: 'identity_unavailable' };
    }
    return {
      ok: true,
      identity: {
        actor: 'lead',
        omniLeadId,
        accountId: session.accountId,
        phoneE164: session.profile.phoneE164?.trim() || undefined,
        displayName: session.displayName,
      },
    };
  }

  const sessionOmni = session.customer.omniLeadId?.trim() || '';
  const sessionPhone = session.customer.primaryPhone?.trim() || undefined;

  if (sessionOmni) {
    return {
      ok: true,
      identity: {
        actor: 'customer',
        omniLeadId: sessionOmni,
        accountId: session.accountId,
        customerId: session.customer.id,
        phoneE164: sessionPhone,
        displayName: session.displayName,
      },
    };
  }

  // Cache me / session chưa có omni (chưa stamp hoặc TTL cũ) — provision/read qua bootstrap.
  const ctx = await fetchCustomerOnlineBootstrapContextSsr();
  if (!ctx || ctx.customerId !== session.customer.id) {
    return { ok: false, reason: 'identity_unavailable' };
  }
  const omniLeadId = ctx.omniLeadId.trim();
  if (!omniLeadId) {
    return { ok: false, reason: 'identity_unavailable' };
  }
  return {
    ok: true,
    identity: {
      actor: 'customer',
      omniLeadId,
      accountId: session.accountId,
      customerId: ctx.customerId,
      phoneE164: ctx.phoneE164?.trim() || sessionPhone,
      displayName: ctx.displayName || session.displayName,
    },
  };
}

/** Cookie → session → identity MTO (một điểm vào cho Route Handler). */
export async function resolveMtoCallerIdentityFromCookies(): Promise<ResolveMtoCallerIdentityResult> {
  const session = await resolvePortalSessionFromCookies();
  return resolveMtoCallerIdentityFromSession(session);
}

/** Claim identity client không được tin — xóa trước khi forward upstream. */
export const CLIENT_IDENTITY_CLAIM_KEYS = [
  'omniLeadId',
  'customerId',
  'accountId',
  'leadAccountId',
  'portalAccountId',
] as const;

export function stripClientIdentityClaims(
  body: Record<string, unknown>,
): Record<string, unknown> {
  const safe = { ...body };
  for (const key of CLIENT_IDENTITY_CLAIM_KEYS) {
    delete safe[key];
  }
  return safe;
}
