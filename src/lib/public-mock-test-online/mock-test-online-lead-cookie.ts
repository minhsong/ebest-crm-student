import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

/** Cookie nhận diện lead đang trong funnel mock-test-online (sau intake thành công). */
export const MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE = 'mto_pending_lead';

/** Đồng bộ với TTL localStorage chờ xác nhận Zalo. */
export const MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC = 7 * 24 * 60 * 60;

export function getMockTestOnlinePendingLeadId(): string | null {
	try {
		const v = cookies().get(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE)?.value ?? '';
		const trimmed = v.trim();
		return trimmed || null;
	} catch {
		return null;
	}
}

export function applyMockTestOnlinePendingLeadCookie(
	res: NextResponse,
	pendingLeadId: string,
): NextResponse {
	const id = pendingLeadId.trim();
	if (!id) return res;
	res.cookies.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, id, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/mock-test-online',
		maxAge: MOCK_TEST_ONLINE_LEAD_COOKIE_MAX_AGE_SEC,
	});
	return res;
}

export function clearMockTestOnlinePendingLeadCookie(res: NextResponse): NextResponse {
	res.cookies.set(MOCK_TEST_ONLINE_PENDING_LEAD_COOKIE, '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/mock-test-online',
		maxAge: 0,
	});
	return res;
}
