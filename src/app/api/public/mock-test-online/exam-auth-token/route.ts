import { NextResponse } from 'next/server';

import { getMockTestOnlinePortalAuthorizeTokenFromCookie } from '@/lib/public-mock-test-online/mock-test-online-exam-auth-cookie';



/** WS mock-test-online — đọc token từ httpOnly cookie (chỉ dùng cho socket auth). */

export async function GET() {

	const token = getMockTestOnlinePortalAuthorizeTokenFromCookie();

	if (!token) {

		return NextResponse.json({ message: 'Phiên làm bài hết hạn.' }, { status: 401 });

	}

	return NextResponse.json({ accessToken: token });

}

