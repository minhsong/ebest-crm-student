import { NextRequest, NextResponse } from 'next/server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { gatewayUnauthorizedResponse } from '@/lib/social-gateway-bff.util';
import { sanitizeApiErrorPayload } from '@/lib/student-safe-errors';
import { fetchMockTestOnlineAttemptStatusNoStore } from '@/lib/public-mock-test-online/fetch-attempt-status.server';

/** Proxy CRM attempt-status — yêu cầu lead portal cookie (omniLeadId từ session). */
export async function GET(request: NextRequest) {
	const session = await resolvePortalSessionFromCookies();
	if (session.actor !== 'lead') {
		return gatewayUnauthorizedResponse();
	}

	const testTypeCode =
		request.nextUrl.searchParams.get('testTypeCode')?.trim() ?? '';
	if (!testTypeCode) {
		return NextResponse.json(
			{ message: 'Thiếu testTypeCode.' },
			{ status: 400 },
		);
	}

	const { status, httpStatus } = await fetchMockTestOnlineAttemptStatusNoStore(
		session.omniLeadId,
		testTypeCode,
	);

	if (!status) {
		if (httpStatus === 500) {
			return NextResponse.json(
				{ message: 'Cấu hình server chưa đúng.' },
				{ status: 500 },
			);
		}
		return NextResponse.json(
			sanitizeApiErrorPayload(
				{},
				httpStatus,
				'Không tải được trạng thái lượt thi.',
			),
			{ status: httpStatus },
		);
	}

	return NextResponse.json(status);
}
