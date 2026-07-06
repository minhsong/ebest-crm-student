import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

/** httpOnly — portalAuthorizeToken; BFF quiz proxy đọc và forward header, không lộ query string. */
export const MOCK_TEST_ONLINE_EXAM_AUTH_COOKIE = 'mto_portal_auth';

const MAX_COOKIE_AGE_SEC = 7 * 24 * 60 * 60;

export function getMockTestOnlinePortalAuthorizeTokenFromCookie(): string | null {
	try {
		const v = cookies().get(MOCK_TEST_ONLINE_EXAM_AUTH_COOKIE)?.value ?? '';
		const trimmed = v.trim();
		return trimmed || null;
	} catch {
		return null;
	}
}

function resolveCookieMaxAgeSec(portalAuthorizeExpiresAt?: string): number {
	const exp = portalAuthorizeExpiresAt?.trim();
	if (exp) {
		const ms = Date.parse(exp) - Date.now();
		if (Number.isFinite(ms) && ms > 0) {
			return Math.min(Math.ceil(ms / 1000), MAX_COOKIE_AGE_SEC);
		}
	}
	return 30 * 60;
}

export function applyMockTestOnlineExamAuthCookie(
	res: NextResponse,
	input: { portalAuthorizeToken: string; portalAuthorizeExpiresAt?: string },
): NextResponse {
	const token = input.portalAuthorizeToken.trim();
	if (!token) return res;
	res.cookies.set(MOCK_TEST_ONLINE_EXAM_AUTH_COOKIE, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: resolveCookieMaxAgeSec(input.portalAuthorizeExpiresAt),
	});
	return res;
}

export function clearMockTestOnlineExamAuthCookie(res: NextResponse): NextResponse {
	res.cookies.set(MOCK_TEST_ONLINE_EXAM_AUTH_COOKIE, '', {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 0,
	});
	return res;
}

/** BFF: bỏ token khỏi JSON trả client — chỉ giữ trong httpOnly cookie. */
export function stripPortalAuthorizeTokenFromGatewayBody<T extends Record<string, unknown>>(
	data: T,
): Omit<T, 'portalAuthorizeToken'> {
	const { portalAuthorizeToken: _removed, ...rest } = data;
	return rest;
}
