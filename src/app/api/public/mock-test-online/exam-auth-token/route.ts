import { NextRequest, NextResponse } from 'next/server';
import { mintMtoPortalAuthorizeToken } from '@/lib/public-mock-test-online/mint-mto-portal-authorize-token.server';

/**
 * WS mock-test-online — mint HMAC từ portal_at + registrationId (không đọc mto_portal_auth).
 */
export async function GET(req: NextRequest) {
	const q = req.nextUrl.searchParams.get('registrationId')?.trim() || '';
	const registrationId = Number(q);
	if (!Number.isFinite(registrationId) || registrationId < 1) {
		return NextResponse.json(
			{ message: 'Thiếu registrationId để mở phiên làm bài.' },
			{ status: 400 },
		);
	}

	const minted = await mintMtoPortalAuthorizeToken({ registrationId });
	if (!minted?.portalAuthorizeToken) {
		return NextResponse.json(
			{ message: 'Phiên làm bài hết hạn.' },
			{ status: 401 },
		);
	}
	return NextResponse.json({ accessToken: minted.portalAuthorizeToken });
}
