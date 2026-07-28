import type { PortalSessionPayload } from '@/lib/portal-auth/resolve-portal-session.server';
import type { PortalLeadSessionSummary } from '@/lib/portal-auth/portal-lead-session.types';
import { toPortalLeadSessionSummary } from '@/lib/portal-auth/portal-lead-session.types';
import type { StudentMeCustomerBrief } from '@/lib/parse-student-me-customer';

export type { PortalLeadSessionSummary };

/** Client-safe session DTO — PI-D18 / BL-Q9. Canonical read: GET /api/portal/session */
export type ClientPortalSessionPayload =
  | { actor: 'guest' }
  | {
      actor: 'customer';
      displayName: string;
      customer: StudentMeCustomerBrief;
      classes: Array<{ id: number; name: string; status?: string | null }>;
    }
  | {
      actor: 'lead';
      displayName: string;
      profile: PortalLeadSessionSummary;
    };

export function toClientPortalSessionPayload(
  session: PortalSessionPayload,
): ClientPortalSessionPayload {
  if (session.actor === 'guest') {
    return { actor: 'guest' };
  }
  if (session.actor === 'customer') {
    const { omniLeadId: _omniLeadId, ...customer } = session.customer;
    return {
      actor: 'customer',
      displayName: session.displayName,
      customer,
      classes: session.classes,
    };
  }
  return {
    actor: 'lead',
    displayName: session.displayName,
    profile: toPortalLeadSessionSummary(session.profile),
  };
}
