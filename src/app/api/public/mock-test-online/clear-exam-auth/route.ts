/**
 * Xóa cookie capability legacy `mto_portal_auth` sau `/exam/done` (Max-Age=0).
 * Capability thật mint lại trên BFF khi làm bài — không phụ thuộc cookie.
 */
import { NextResponse } from 'next/server';
import { clearMockTestOnlineExamAuthCookie } from '@/lib/public-mock-test-online/mock-test-online-exam-auth-cookie';
import { clearMockTestOnlineFunnelSessionCookie } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';

export async function POST() {
	let res = NextResponse.json({ cleared: true });
	res = clearMockTestOnlineExamAuthCookie(res);
	res = clearMockTestOnlineFunnelSessionCookie(res);
	return res;
}
