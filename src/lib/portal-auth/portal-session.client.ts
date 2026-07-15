import type { ClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import {
	parseClientPortalSessionPayload,
} from '@/lib/portal-auth/portal-session-nav';

/** Client hydrate — SSOT GET /api/portal/session. */
export async function fetchClientPortalSession(): Promise<ClientPortalSessionPayload> {
	try {
		const res = await fetch('/api/portal/session', { cache: 'no-store' });
		if (!res.ok) return { actor: 'guest' };
		return parseClientPortalSessionPayload(await res.json().catch(() => null));
	} catch {
		return { actor: 'guest' };
	}
}

/** Logout UI SSOT — xóa cả lead + customer cookie. */
export async function portalLogoutClient(): Promise<void> {
	try {
		await fetch('/api/auth/portal/logout', { method: 'POST' });
	} catch {
		// cookie server có thể đã clear một phần — client vẫn reset state
	}
}
