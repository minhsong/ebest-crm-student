import type { ClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import {
	PORTAL_MOCK_TEST_RESULTS_ROUTES,
	resolvePostPortalLoginPath,
} from '@/lib/portal-auth/session-routes';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';

/** Parse JSON body từ `/api/portal/session` — fail-safe guest. */
export function parseClientPortalSessionPayload(
	data: unknown,
): ClientPortalSessionPayload {
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		return { actor: 'guest' };
	}
	const o = data as Record<string, unknown>;
	if (o.actor === 'customer') {
		return {
			actor: 'customer',
			displayName:
				typeof o.displayName === 'string' && o.displayName.trim()
					? o.displayName.trim()
					: 'Học viên',
		};
	}
	if (o.actor === 'lead') {
		return {
			actor: 'lead',
			displayName:
				typeof o.displayName === 'string' && o.displayName.trim()
					? o.displayName.trim()
					: 'Thí sinh',
		};
	}
	return { actor: 'guest' };
}

/** Home zone khi đã login (chrome / redirect-if-logged-in). */
export function homePathForPortalActor(
	actor: 'customer' | 'lead',
): string {
	return actor === 'lead'
		? PORTAL_MOCK_TEST_ROUTES.hub
		: '/';
}

/** Redirect sau login form (HV mặc định mock-test-results theo resolvePost). */
export function postLoginPathForPortalActor(
	actor: 'customer' | 'lead',
	explicitRedirect?: string | null,
): string {
	const raw = explicitRedirect?.trim();
	if (raw && raw.startsWith('/') && !raw.startsWith('//')) return raw;
	if (actor === 'lead') return resolvePostPortalLoginPath('lead');
	return '/';
}

export function homePathForClientSession(
	session: ClientPortalSessionPayload,
): string | null {
	if (session.actor === 'guest') return null;
	return homePathForPortalActor(session.actor);
}
