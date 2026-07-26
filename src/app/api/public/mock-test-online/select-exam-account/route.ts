import { NextRequest, NextResponse } from 'next/server';
import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';
import {
	buildCrmStudentUrl,
	unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { mockTestBffCatchResponse } from '@/lib/public-mock-test-online/mock-test-bff-catch-response';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';

/**
 * Auth-first select — BFF chỉ forward sessionId/variant + cookie portal_at.
 * Identity (email, accountId, omniLeadId, phone) resolve trên CRM từ JWT /me.
 */
export async function POST(req: NextRequest) {
	const token = getPortalAccessTokenFromCookie()?.trim();
	const apiBase = getApiBaseUrl();
	if (!token || !apiBase) {
		return NextResponse.json(
			{
				message: 'Vui lòng đăng nhập để chọn bài thi.',
				errorCode: 'AUTH_REQUIRED',
			},
			{ status: 401 },
		);
	}

	const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
	const sessionId =
		typeof body.sessionId === 'number'
			? body.sessionId
			: typeof body.sessionId === 'string'
				? parseInt(body.sessionId, 10)
				: NaN;
	if (!Number.isFinite(sessionId) || sessionId < 1) {
		return NextResponse.json(
			{ message: 'Thiếu chiến dịch / bài thi.', errorCode: 'INVALID_SESSION' },
			{ status: 400 },
		);
	}

	const crmBody = {
		sessionId,
		...(body.testVariantChoice === 'full' || body.testVariantChoice === 'mini'
			? { testVariantChoice: body.testVariantChoice }
			: {}),
	};

	try {
		const res = await fetch(
			buildCrmStudentUrl(apiBase, STUDENT_API.portalMockTestSelectExam),
			{
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(crmBody),
				cache: 'no-store',
			},
		);
		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		const payload = (unwrapCrmResponseBody(data) ?? data) as Record<
			string,
			unknown
		>;
		if (!res.ok) {
			return NextResponse.json(
				mapMockTestBffErrorForClient(
					payload,
					res.status,
					'Không chọn được bài thi. Vui lòng thử lại.',
				),
				{ status: res.status },
			);
		}
		return NextResponse.json(payload, { status: res.status });
	} catch (error) {
		return mockTestBffCatchResponse(error, {
			errorCode: 'BFF_SELECT_EXAM_ACCOUNT_ERROR',
		});
	}
}
