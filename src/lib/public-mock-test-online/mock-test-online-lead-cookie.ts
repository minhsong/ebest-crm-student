import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

/**
 * FunnelSession cookie (Phase 1) — giá trị = funnelSessionId ≡ pendingLeadId.
 * Dual-read với `mto_pending_lead` trong 7 ngày migrate.
 */
export const MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE = 'mto_funnel_session';

/** @deprecated alias — vẫn dual-write để client cũ / bookmark. */
export const MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE = 'mto_pending_lead';

/** Đồng bộ với TTL Redis funnel / localStorage chờ xác nhận Zalo. */
export const MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;

function readCookieSafe(name: string): string | null {
	try {
		const v = cookies().get(name)?.value ?? '';
		const trimmed = v.trim();
		return trimmed || null;
	} catch {
		return null;
	}
}

/** Dual-read: ưu tiên `mto_funnel_session`, fallback `mto_pending_lead`. */
export function getMockTestOnlineFunnelSessionId(): string | null {
	return (
		readCookieSafe(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE) ||
		readCookieSafe(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE)
	);
}

/** @deprecated dùng getMockTestOnlineFunnelSessionId */
export function getMockTestOnlinePendingLeadId(): string | null {
	return getMockTestOnlineFunnelSessionId();
}

function setFunnelCookies(res: NextResponse, funnelSessionId: string): void {
	const id = funnelSessionId.trim();
	if (!id) return;
	const opts = {
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		path: '/mock-test-online',
		maxAge: MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC,
	};
	res.cookies.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE, id, opts);
	res.cookies.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, id, opts);
}

export function applyMockTestOnlineFunnelSessionCookie(
	res: NextResponse,
	funnelSessionId: string,
): NextResponse {
	setFunnelCookies(res, funnelSessionId);
	return res;
}

/** @deprecated alias dual-write */
export function applyMockTestOnlinePendingLeadCookie(
	res: NextResponse,
	pendingLeadId: string,
): NextResponse {
	return applyMockTestOnlineFunnelSessionCookie(res, pendingLeadId);
}

export function clearMockTestOnlineFunnelSessionCookie(
	res: NextResponse,
): NextResponse {
	const clear = {
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		path: '/mock-test-online',
		maxAge: 0,
	};
	res.cookies.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE, '', clear);
	res.cookies.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, '', clear);
	return res;
}

/** @deprecated */
export function clearMockTestOnlinePendingLeadCookie(
	res: NextResponse,
): NextResponse {
	return clearMockTestOnlineFunnelSessionCookie(res);
}
