/**
 * Lý do guest sau khi đã từng có cookie / CRM từ chối session.
 * Anonymous thật (không cookie) → không set field này.
 */
export type PortalGuestAuthFailure = 'expired' | 'relogin_required';

export function isPortalGuestAuthFailure(
	value: unknown,
): value is PortalGuestAuthFailure {
	return value === 'expired' || value === 'relogin_required';
}

export function portalAuthFailureRequiresReLogin(
	authFailure?: PortalGuestAuthFailure | null,
): boolean {
	return (
		authFailure === 'expired' || authFailure === 'relogin_required'
	);
}
