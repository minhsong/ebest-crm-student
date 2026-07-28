import type { ClientPortalSessionPayload } from '@/lib/portal-auth/portal-session-client.util';
import {
	parseClientPortalSessionPayload,
} from '@/lib/portal-auth/portal-session-nav';
import { PORTAL_POST_LOGOUT_PATH } from '@/lib/portal-auth/session-routes';

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

/** Logout UI SSOT — xóa cookie rồi hard-navigate khỏi trang auth (tránh remount thiếu provider). */
export async function portalLogoutClient(): Promise<void> {
	try {
		await fetch('/api/auth/portal/logout', { method: 'POST' });
	} catch {
		// cookie server có thể đã clear một phần — client vẫn reset / điều hướng
	}
}

/**
 * Logout + rời trang hiện tại (full document navigation).
 * Soft `router.replace` dễ race: session → guest trong khi view lead vẫn mount.
 */
export async function portalLogoutAndLeave(
	href: string = PORTAL_POST_LOGOUT_PATH,
): Promise<void> {
	await portalLogoutClient();
	if (typeof window !== 'undefined') {
		window.location.assign(href);
	}
}
