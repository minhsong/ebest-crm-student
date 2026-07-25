import { NextResponse } from 'next/server';

/**
 * Legacy Funnel select — retired (PO-D24/D25).
 * Dùng POST /api/public/mock-test-online/select-exam-account.
 */
export async function POST() {
	return NextResponse.json(
		{
			message:
				'Luồng chọn đề cũ đã ngừng. Vui lòng đăng nhập và chọn bài thi lại.',
			errorCode: 'FUNNEL_SELECT_RETIRED',
			next: '/mock-test-online/select-exam',
		},
		{ status: 410 },
	);
}
