/**
 * Probe phiên — thin adapter trên `/api/portal/session` + lead profile khi cần.
 * Layout mới ưu tiên `usePortalSession`; giữ API này cho legacy callers.
 */
import { fetchLeadProfile } from '@/lib/lead-portal/client-api';
import { isLeadPortalUnauthorizedError } from '@/lib/lead-portal/errors';
import type { LeadProfile } from '@/lib/lead-portal/types';
import { isLeadIdentityUpgraded } from '@/lib/portal-auth/portal-auth-session';
import { fetchClientPortalSession } from '@/lib/portal-auth/portal-session.client';

export type PortalSessionProbe =
	| { kind: 'none' }
	| { kind: 'lead'; profile: LeadProfile }
	| { kind: 'student' };

export async function probePortalSession(): Promise<PortalSessionProbe> {
	const session = await fetchClientPortalSession();
	if (session.actor === 'customer') return { kind: 'student' };
	if (session.actor === 'guest') return { kind: 'none' };

	try {
		const profile = await fetchLeadProfile();
		if (isLeadIdentityUpgraded(profile)) return { kind: 'student' };
		return { kind: 'lead', profile };
	} catch (e) {
		if (isLeadPortalUnauthorizedError(e)) return { kind: 'none' };
		return { kind: 'none' };
	}
}
