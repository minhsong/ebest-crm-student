import { NextRequest, NextResponse } from 'next/server';
import { gatewayUnauthorizedResponse } from '@/lib/social-gateway-bff.util';
import { sanitizeApiErrorPayload } from '@/lib/student-safe-errors';
import { fetchMockTestOnlineAttemptStatusNoStore } from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { resolveMtoCallerIdentityFromCookies } from '@/features/portal-mock-test/server/resolve-mto-caller-identity.server';

/** Proxy CRM attempt-status — identity từ cookie session (không nhận omni từ client). */
export async function GET(request: NextRequest) {
	const resolved = await resolveMtoCallerIdentityFromCookies();
	if (!resolved.ok) {
		if (resolved.reason === 'guest') {
			return gatewayUnauthorizedResponse();
		}
		return NextResponse.json(
			{ message: 'Không tải được thông tin thi thử.' },
			{ status: 502 },
		);
	}

	const testTypeCode =
		request.nextUrl.searchParams.get('testTypeCode')?.trim() ?? '';
	if (!testTypeCode) {
		return NextResponse.json(
			{ message: 'Thiếu testTypeCode.' },
			{ status: 400 },
		);
	}

	const { omniLeadId, phoneE164 } = resolved.identity;
	const { status, httpStatus } = await fetchMockTestOnlineAttemptStatusNoStore(
		omniLeadId,
		testTypeCode,
		phoneE164?.trim()
			? { phoneNormalized: phoneE164.trim() }
			: undefined,
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
