import type { LeadProfile } from '@/lib/lead-portal/types';

/**
 * Lead session summary — lightweight DTO từ portal session (gate/layout).
 * Không chứa `omniLeadId` / `identityUpgrade` (PI-D18).
 * Để chỉnh sửa profile đầy đủ, dùng `LeadProfile` qua `/api/lead/me`.
 */
export type PortalLeadSessionSummary = {
  id: number;
  displayName: string | null;
  email: string;
  phoneE164: string | null;
  emailVerifiedAt: string | null;
  profileCompleted: boolean;
  passwordSetupRequired?: boolean;
  profileCompletedAt?: string | null;
  googleLinked?: boolean;
  missingProfileFields?: string[];
};

/** Strip server-only / editable-only fields → client session summary. */
export function toPortalLeadSessionSummary(
  profile: LeadProfile | Record<string, unknown>,
): PortalLeadSessionSummary {
  const p = profile as LeadProfile & { missingProfileFields?: string[] };
  return {
    id: p.id,
    displayName: p.displayName ?? null,
    email: p.email,
    phoneE164: p.phoneE164 ?? null,
    emailVerifiedAt: p.emailVerifiedAt ?? null,
    profileCompleted: p.profileCompleted === true,
    passwordSetupRequired: p.passwordSetupRequired,
    profileCompletedAt: p.profileCompletedAt ?? null,
    googleLinked: p.googleLinked,
    missingProfileFields: p.missingProfileFields,
  };
}
