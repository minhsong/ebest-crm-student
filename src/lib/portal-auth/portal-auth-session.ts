/** Types + pure helpers — an toàn import từ Client Component. */

export type PortalAuthActor = 'customer' | 'lead';

export type PortalLoginActorPayload = {
  actor?: PortalAuthActor | 'lead';
  accessToken?: string;
  leadAccount?: unknown;
  customer?: unknown;
};

/** Suy actor từ payload CRM unified login. */
export function resolvePortalLoginActor(
  payload: PortalLoginActorPayload,
): PortalAuthActor {
  if (payload.actor === 'lead' || payload.leadAccount) return 'lead';
  return 'customer';
}

export type LeadIdentityUpgradePayload = {
  available?: boolean;
  accessToken?: string;
  customerId?: number;
  applied?: boolean;
};

export type LeadMeCrmPayload = {
  identityUpgrade?: LeadIdentityUpgradePayload;
  [key: string]: unknown;
};

export function isLeadIdentityUpgraded(profile: {
  identityUpgrade?: LeadIdentityUpgradePayload;
}): boolean {
  return Boolean(profile.identityUpgrade?.applied);
}
