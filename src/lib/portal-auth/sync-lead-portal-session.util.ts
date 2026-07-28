import type { ClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import { toPortalLeadSessionSummary } from '@/lib/portal-auth/portal-lead-session.types';
import type { LeadProfile } from '@/lib/lead-portal/types';

/** Map lead profile response → client session payload (sau PATCH/complete-profile). */
export function leadProfileToClientSessionPayload(
  profile: LeadProfile,
  displayNameFallback?: string | null,
): Extract<ClientPortalSessionPayload, { actor: 'lead' }> {
  const summary = toPortalLeadSessionSummary(profile);
  const displayName =
    summary.displayName?.trim() ||
    displayNameFallback?.trim() ||
    'Thí sinh';
  return {
    actor: 'lead',
    displayName,
    profile: summary,
  };
}
