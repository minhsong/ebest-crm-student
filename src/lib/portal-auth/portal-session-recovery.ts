import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';
import {
	portalAuthFailureRequiresReLogin,
	type PortalGuestAuthFailure,
} from '@/lib/portal-auth/portal-session-auth-failure';
import { portalLogoutAndLeave } from '@/lib/portal-auth/portal-session.client';
import { PORTAL_LOGIN_PATH } from '@/lib/portal-auth/session-routes';

/**
 * Href login cho layout/API auth-required.
 * - Có authFailure (JWT hết hạn / re-login) → `session=expired`
 * - Guest thuần (chưa đăng nhập) → login thường + returnUrl
 */
export function buildAuthRequiredLoginHref(input: {
	returnUrl: string;
	authFailure?: PortalGuestAuthFailure | null;
}): string {
	return (
		buildPortalLoginHref({
			returnUrl: input.returnUrl,
			sessionExpired: portalAuthFailureRequiresReLogin(input.authFailure),
		}) || PORTAL_LOGIN_PATH
	);
}

/**
 * Client: clear cookie + hard navigate về login (khu auth gặp 401).
 * Mặc định gắn `session=expired` — JWT/proxy unauthorized.
 */
export async function recoverInvalidPortalSession(input?: {
	returnUrl?: string;
	/** Mặc định true — API/proxy 401. */
	sessionExpired?: boolean;
}): Promise<void> {
	const sessionExpired = input?.sessionExpired !== false;
	let returnUrl = input?.returnUrl;
	if (!returnUrl && typeof window !== 'undefined') {
		returnUrl = `${window.location.pathname}${window.location.search}`;
	}
	const href = buildPortalLoginHref({
		returnUrl: returnUrl || '/',
		sessionExpired,
	});
	await portalLogoutAndLeave(href || PORTAL_LOGIN_PATH);
}
