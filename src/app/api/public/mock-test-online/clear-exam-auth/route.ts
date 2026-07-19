import { NextResponse } from 'next/server';
import { clearMockTestOnlineExamAuthCookie } from '@/lib/public-mock-test-online/mock-test-online-exam-auth-cookie';

/**
 * Xóa cookie capability `mto_portal_auth` sau `/exam/done`.
 * Metadata sessionStorage do client clear riêng.
 */
export async function POST() {
	const res = NextResponse.json({ cleared: true });
	return clearMockTestOnlineExamAuthCookie(res);
}
