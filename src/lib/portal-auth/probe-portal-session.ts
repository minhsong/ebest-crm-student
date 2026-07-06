import {
  fetchLeadProfile,
} from '@/lib/lead-portal/client-api';
import { isLeadPortalUnauthorizedError } from '@/lib/lead-portal/errors';
import type { LeadProfile } from '@/lib/lead-portal/types';
import { isLeadIdentityUpgraded } from '@/lib/portal-auth/portal-auth-session';

export type PortalSessionProbe =
  | { kind: 'none' }
  | { kind: 'lead'; profile: LeadProfile }
  | { kind: 'student' };

/**
 * Probe phiên portal: customer cookie trước, rồi lead (PI-D2 một cookie active).
 * Dùng cho layout gate và redirect sau login.
 */
export async function probePortalSession(): Promise<PortalSessionProbe> {
  try {
    const res = await fetch('/api/me', { cache: 'no-store' });
    if (res.ok) return { kind: 'student' };
  } catch {
    // ignore — thử lead
  }

  try {
    const profile = await fetchLeadProfile();
    if (isLeadIdentityUpgraded(profile)) return { kind: 'student' };
    return { kind: 'lead', profile };
  } catch (e) {
    if (isLeadPortalUnauthorizedError(e)) return { kind: 'none' };
    return { kind: 'none' };
  }
}
