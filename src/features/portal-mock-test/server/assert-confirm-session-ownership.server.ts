import { getCachedPortalSession } from '@/lib/portal-auth/resolve-portal-session.server';

export type ConfirmSessionOwnershipResult =
	| { ok: true; accountId: string }
	| { ok: false; status: number; message: string };

/**
 * Auth-first (PO-D24/D25) — confirm/status ownership theo portal_at.
 * accountId lấy từ CRM `portal/session` (JWT đã verify), không decode JWT ở BFF.
 * GW `assertOwnsPending(accountId, pendingId)` là gate ownership thật.
 */
export async function resolveConfirmSessionOwnership(
	pendingRegistrationId: string,
): Promise<ConfirmSessionOwnershipResult> {
	const pendingId = pendingRegistrationId.trim();
	if (!pendingId) {
		return {
			ok: false,
			status: 400,
			message: 'Thiếu mã phiên xác minh.',
		};
	}

	const session = await getCachedPortalSession();
	if (session.actor === 'guest') {
		return {
			ok: false,
			status: 401,
			message: 'Vui lòng đăng nhập để tiếp tục xác minh Zalo.',
		};
	}

	const accountId = session.accountId?.trim() || '';
	if (!accountId) {
		return {
			ok: false,
			status: 403,
			message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
		};
	}

	return { ok: true, accountId };
}
