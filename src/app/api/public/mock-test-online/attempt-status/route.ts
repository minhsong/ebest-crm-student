import { NextRequest, NextResponse } from 'next/server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { gatewayUnauthorizedResponse } from '@/lib/social-gateway-bff.util';
import { sanitizeApiErrorPayload } from '@/lib/student-safe-errors';
import { fetchMockTestOnlineAttemptStatusNoStore } from '@/lib/public-mock-test-online/fetch-attempt-status.server';
import { fetchCustomerOnlineBootstrapContextSsr } from '@/features/portal-mock-test/server/fetch-customer-bootstrap-context.server';

/** Proxy CRM attempt-status — lead hoặc HV portal cookie. */
export async function GET(request: NextRequest) {
	const session = await resolvePortalSessionFromCookies();
	if (session.actor === 'guest') {
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

	let omniLeadId: string;
	let phoneNormalized: string | undefined;

	if (session.actor === 'lead') {
		omniLeadId = session.omniLeadId;
		phoneNormalized = session.profile.phoneE164;
	} else {
		const ctx = await fetchCustomerOnlineBootstrapContextSsr();
		if (!ctx || ctx.customerId !== session.customer.id) {
			return NextResponse.json(
				{ message: 'Không tải được thông tin thi thử.' },
				{ status: 502 },
			);
		}
		omniLeadId = ctx.omniLeadId;
		phoneNormalized = ctx.phoneE164;
	}

	const { status, httpStatus } = await fetchMockTestOnlineAttemptStatusNoStore(
		omniLeadId,
		testTypeCode,
		phoneNormalized?.trim()
			? { phoneNormalized: phoneNormalized.trim() }
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
