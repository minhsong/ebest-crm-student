import { NextResponse } from 'next/server';

/**
 * Guest intake Funnel — retired (PO-D24 / B1).
 * Entry = đăng nhập/đăng ký Portal rồi chọn đề.
 */
export async function POST() {
	return NextResponse.json(
		{
			message:
				'Đăng ký khách không còn hỗ trợ. Vui lòng đăng nhập hoặc đăng ký tài khoản để chọn bài thi.',
			errorCode: 'GUEST_INTAKE_RETIRED',
			next: '/login?returnUrl=%2Fmock-test-online%2Fselect-exam',
		},
		{ status: 410 },
	);
}
