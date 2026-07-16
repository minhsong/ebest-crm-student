/**
 * Map CRM lead/me → DTO an toàn cho browser (M7-7).
 */

import type { LeadProfile } from '@/lib/lead-portal/types';

function isInternalLeadEmail(email: string): boolean {
  return email.trim().toLowerCase().endsWith('@mto.ebest.internal');
}

export function mapLeadMeForClient(payload: unknown): LeadProfile {
  const raw =
    payload && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {};

  const upgradeRaw =
    raw.identityUpgrade && typeof raw.identityUpgrade === 'object'
      ? (raw.identityUpgrade as Record<string, unknown>)
      : undefined;

  let email = String(raw.email ?? '');
  if (isInternalLeadEmail(email)) {
    email = '';
  }

  const profile: LeadProfile = {
    id: Number(raw.id ?? 0),
    displayName:
      typeof raw.displayName === 'string' ? raw.displayName : null,
    email,
    phoneE164: String(raw.phoneE164 ?? raw.phone ?? ''),
    emailVerifiedAt:
      typeof raw.emailVerifiedAt === 'string' ? raw.emailVerifiedAt : null,
    omniLeadId: String(raw.omniLeadId ?? ''),
    /** Thiếu field (API cũ) → coi như đã hoàn thiện, tránh khóa layout. */
    profileCompleted: raw.profileCompleted !== false,
    profileCompletedAt:
      typeof raw.profileCompletedAt === 'string'
        ? raw.profileCompletedAt
        : null,
  };

  if (upgradeRaw) {
    profile.identityUpgrade = {
      available: upgradeRaw.available === true,
      applied: upgradeRaw.applied === true,
    };
  }

  return profile;
}
