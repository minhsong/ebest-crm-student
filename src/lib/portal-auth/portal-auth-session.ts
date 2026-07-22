/** Types + pure helpers — an toàn import từ Client Component. */

export type PortalAuthActor = 'customer' | 'lead';

export type PortalLoginActorPayload = {
  actor?: PortalAuthActor | 'lead';
  accessToken?: string;
  /** CRM Lead login — field chính. */
  account?: unknown;
  /** Legacy alias (một số client cũ). */
  leadAccount?: unknown;
  customer?: unknown;
};

/** Suy actor từ payload CRM unified login. */
export function resolvePortalLoginActor(
  payload: PortalLoginActorPayload,
): PortalAuthActor {
  if (payload.actor === 'lead' || payload.account || payload.leadAccount) {
    return 'lead';
  }
  return 'customer';
}

export type LeadIdentityUpgradePayload = {
  available?: boolean;
  /** @deprecated UPA-D15 — không silent mint; luôn re-login. */
  accessToken?: string;
  customerId?: number;
  reLoginRequired?: boolean;
  reason?: string;
  applied?: boolean;
};

export type LeadMeCrmPayload = {
  identityUpgrade?: LeadIdentityUpgradePayload;
  [key: string]: unknown;
};

/**
 * Convert Lead→Customer đã áp dụng (UPA-D15).
 * Sau soft convert CRM thường trả `reLoginRequired` (không silent mint) —
 * `applied` có thể false sau khi BFF normalize.
 */
export function isLeadIdentityUpgraded(profile: {
  identityUpgrade?: LeadIdentityUpgradePayload;
}): boolean {
  const u = profile.identityUpgrade;
  return Boolean(
    u?.available && (u.reLoginRequired === true || u.applied === true),
  );
}
