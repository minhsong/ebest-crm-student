import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

/**
 * FunnelSession cookie (Phase 1) — giá trị = funnelSessionId ≡ pendingLeadId.
 * Dual-read với `mto_pending_lead` trong 7 ngày migrate.
 */
export const MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE = 'mto_funnel_session';
/** P5h — cookie canonical gửi được tới cả page `/mock-test-online` và BFF `/api`. */
export const MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2 =
	'mto_funnel_session_v2';

/** @deprecated alias — vẫn dual-write để client cũ / bookmark. */
export const MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE = 'mto_pending_lead';

/** Đồng bộ với TTL Redis funnel / localStorage chờ xác nhận Zalo. */
export const MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;
const FUNNEL_COOKIE_PATH = '/';
const LEGACY_FUNNEL_COOKIE_PATH = '/mock-test-online';

function funnelCookieOptions(path: string, maxAge: number) {
	return {
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		path,
		maxAge,
	};
}

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
		readCookieSafe(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2) ||
		readCookieSafe(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE) ||
		readCookieSafe(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE)
	);
}

function setFunnelCookies(res: NextResponse, funnelSessionId: string): void {
	const id = funnelSessionId.trim();
	if (!id) return;
	const rootOpts = funnelCookieOptions(
		FUNNEL_COOKIE_PATH,
		MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC,
	);
	const legacyOpts = funnelCookieOptions(
		LEGACY_FUNNEL_COOKIE_PATH,
		MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC,
	);
	res.cookies.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2, id, rootOpts);
	res.cookies.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE, id, legacyOpts);
	res.cookies.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, id, legacyOpts);
}

export function applyMockTestOnlineFunnelSessionCookie(
	res: NextResponse,
	funnelSessionId: string,
): NextResponse {
	setFunnelCookies(res, funnelSessionId);
	return res;
}

export function clearMockTestOnlineFunnelSessionCookie<T = unknown>(
	res: NextResponse<T>,
): NextResponse<T> {
	res.cookies.set(
		MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2,
		'',
		funnelCookieOptions(FUNNEL_COOKIE_PATH, 0),
	);
	const clearLegacy = funnelCookieOptions(LEGACY_FUNNEL_COOKIE_PATH, 0);
	res.cookies.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE, '', clearLegacy);
	res.cookies.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, '', clearLegacy);
	return res;
}

/**
 * Ghi funnel-session cookie qua cookie store (Server Action / Route Handler).
 * Dùng khi không có NextResponse để gắn cookie (vd. Server Action + redirect()).
 */
export function writeMockTestOnlineFunnelSessionCookieStore(
	funnelSessionId: string,
): void {
	const id = funnelSessionId.trim();
	if (!id) return;
	const rootOpts = funnelCookieOptions(
		FUNNEL_COOKIE_PATH,
		MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC,
	);
	const legacyOpts = funnelCookieOptions(
		LEGACY_FUNNEL_COOKIE_PATH,
		MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC,
	);
	const store = cookies();
	store.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2, id, rootOpts);
	store.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE, id, legacyOpts);
	store.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, id, legacyOpts);
}

/** Xóa funnel-session cookie qua cookie store (Server Action / Route Handler). */
export function clearMockTestOnlineFunnelSessionCookieStore(): void {
	const store = cookies();
	store.set(
		MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2,
		'',
		funnelCookieOptions(FUNNEL_COOKIE_PATH, 0),
	);
	const clearLegacy = funnelCookieOptions(LEGACY_FUNNEL_COOKIE_PATH, 0);
	store.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE, '', clearLegacy);
	store.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, '', clearLegacy);
}
