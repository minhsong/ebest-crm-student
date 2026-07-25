/**
 * Legacy Funnel cookie names — chỉ clear Max-Age=0 (PO-D25).
 * Không đọc / không ghi SoT; identity = portal_at.
 */
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

export const MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE = 'mto_funnel_session';
export const MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2 =
	'mto_funnel_session_v2';
/** @deprecated clear-only */
export const MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE = 'mto_pending_lead';

const FUNNEL_COOKIE_PATH = '/';
const LEGACY_FUNNEL_COOKIE_PATH = '/mock-test-online';

function clearOpts(path: string) {
	return {
		httpOnly: true,
		sameSite: 'lax' as const,
		secure: process.env.NODE_ENV === 'production',
		path,
		maxAge: 0,
	};
}

export function clearMockTestOnlineFunnelSessionCookie<T = unknown>(
	res: NextResponse<T>,
): NextResponse<T> {
	res.cookies.set(
		MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2,
		'',
		clearOpts(FUNNEL_COOKIE_PATH),
	);
	const legacy = clearOpts(LEGACY_FUNNEL_COOKIE_PATH);
	res.cookies.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE, '', legacy);
	res.cookies.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, '', legacy);
	return res;
}

export function clearMockTestOnlineFunnelSessionCookieStore(): void {
	const store = cookies();
	store.set(
		MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE_V2,
		'',
		clearOpts(FUNNEL_COOKIE_PATH),
	);
	const legacy = clearOpts(LEGACY_FUNNEL_COOKIE_PATH);
	store.set(MOCK_TEST_ONLINE_FUNNEL_SESSION_COOKIE, '', legacy);
	store.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, '', legacy);
}
