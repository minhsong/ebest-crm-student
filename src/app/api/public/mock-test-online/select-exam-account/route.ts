import { NextRequest, NextResponse } from 'next/server';
import {
	buildGatewayServiceHeaders,
	getSocialGatewayConfig,
	gatewayConfigErrorResponse,
} from '@/lib/social-gateway-bff.util';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { mockTestBffCatchResponse } from '@/lib/public-mock-test-online/mock-test-bff-catch-response';
import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';
import {
	buildCrmStudentUrl,
	unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import type { PortalMockTestExamHome } from '@/features/portal-mock-test/server/fetch-my-exam-home.server';

function forwardOriginHeaders(req: NextRequest): Record<string, string> {
	const headers: Record<string, string> = {};
	const origin = req.headers.get('origin');
	const referer = req.headers.get('referer');
	if (origin) headers.Origin = origin;
	if (referer) headers.Referer = referer;
	return headers;
}

/** Soft VN mobile/landline → E.164; invalid → null (không chặn select nếu trống). */
function normalizeOptionalVnPhone(raw: string): string | null {
	const digits = raw.replace(/\D/g, '');
	if (!digits) return null;
	let national = digits;
	if (national.startsWith('84')) national = national.slice(2);
	if (national.startsWith('0')) national = national.slice(1);
	if (national.length < 9 || national.length > 10) return null;
	if (!/^[3-9]/.test(national)) return null;
	return `+84${national}`;
}

/**
 * Auth-first select (PO-D24/D30) — actor từ portal_at + my-exam-home.
 * SĐT optional; Omni ensure trên CRM home; không Funnel cookie.
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

	let examHome: PortalMockTestExamHome | null = null;
	try {
		const homeRes = await fetch(
			buildCrmStudentUrl(apiBase, STUDENT_API.portalMockTestExamHome),
			{
				headers: {
					Authorization: `Bearer ${token}`,
					Accept: 'application/json',
				},
				cache: 'no-store',
			},
		);
		if (!homeRes.ok) {
			return NextResponse.json(
				{
					message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
					errorCode: 'AUTH_REQUIRED',
				},
				{ status: homeRes.status === 401 ? 401 : 403 },
			);
		}
		const raw = await homeRes.json().catch(() => null);
		examHome = (unwrapCrmResponseBody(raw) ?? raw) as PortalMockTestExamHome;
	} catch (error) {
		return mockTestBffCatchResponse(error, { errorCode: 'BFF_SELECT_EXAM_AUTH' });
	}

	if (examHome?.gates?.requireCompleteProfileBeforeSelect) {
		const isCustomer = examHome.account?.accountType === 'customer';
		return NextResponse.json(
			{
				message:
					'Bạn đã hoàn thành một bài thi. Vui lòng hoàn thiện hồ sơ (số điện thoại bắt buộc) để xem điểm và thi tiếp.',
				errorCode: 'PROFILE_COMPLETION_REQUIRED',
				nextPath: isCustomer
					? '/mock-test?notice=profile_required'
					: '/lead/complete-profile',
			},
			{ status: 403 },
		);
	}

	if (examHome?.activeAttempt?.resumeAllowed) {
		return NextResponse.json(
			{
				message:
					'Bạn đang có bài thi làm dở. Vui lòng tiếp tục làm bài trước khi chọn đề mới.',
				errorCode: 'MOCK_TEST_ONLINE_IN_EXAM_ACTIVE',
				activeAttempt: examHome.activeAttempt,
			},
			{ status: 403 },
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

	const accountId = String(examHome?.account?.accountId ?? '').trim();
	const omniLeadId = String(examHome?.account?.omniLeadId ?? '').trim();
	const displayName = String(
		examHome?.account?.displayName ?? 'Thí sinh',
	).trim();
	const phoneFromBody =
		typeof body.primaryPhoneE164 === 'string'
			? body.primaryPhoneE164.trim()
			: typeof body.primaryPhone === 'string'
				? body.primaryPhone.trim()
				: '';
	const phoneRaw = (phoneFromBody || examHome?.account?.phone || '').trim();
	let primaryPhoneE164: string | undefined;
	if (phoneRaw) {
		const normalized = normalizeOptionalVnPhone(phoneRaw);
		if (!normalized) {
			return NextResponse.json(
				{
					message: 'Số điện thoại không hợp lệ. Vui lòng nhập số Việt Nam.',
					errorCode: 'PHONE_INVALID',
				},
				{ status: 400 },
			);
		}
		primaryPhoneE164 = normalized;
	}

	if (!accountId) {
		return NextResponse.json(
			{
				message: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
				errorCode: 'AUTH_REQUIRED',
			},
			{ status: 401 },
		);
	}
	if (!omniLeadId) {
		return NextResponse.json(
			{
				message:
					'Không khởi tạo được hồ sơ thi thử. Vui lòng thử lại hoặc liên hệ Ebest.',
				errorCode: 'OMNI_ENSURE_FAILED',
			},
			{ status: 400 },
		);
	}

	const cfg = getSocialGatewayConfig();
	if (!cfg) {
		return gatewayConfigErrorResponse('mock-test-online.select-exam-account');
	}

	const gwBody = {
		accountId,
		omniLeadId,
		displayName: displayName || 'Thí sinh',
		...(primaryPhoneE164 ? { primaryPhoneE164 } : {}),
		primaryEmail:
			typeof body.primaryEmail === 'string' ? body.primaryEmail.trim() : undefined,
		sessionId,
		testVariantChoice:
			body.testVariantChoice === 'full' || body.testVariantChoice === 'mini'
				? body.testVariantChoice
				: undefined,
		resultDeliveryEmailOptIn:
			typeof body.resultDeliveryEmailOptIn === 'boolean'
				? body.resultDeliveryEmailOptIn
				: undefined,
	};

	const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/select-exam-account`;
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: buildGatewayServiceHeaders(cfg, forwardOriginHeaders(req)),
			body: JSON.stringify(gwBody),
			cache: 'no-store',
		});
		const data = (await res.json().catch(() => ({}))) as { message?: string };
		if (!res.ok) {
			return NextResponse.json(
				mapMockTestBffErrorForClient(
					data,
					res.status,
					'Không chọn được bài thi. Vui lòng thử lại.',
				),
				{ status: res.status },
			);
		}
		return NextResponse.json(data, { status: res.status });
	} catch (error) {
		return mockTestBffCatchResponse(error, {
			errorCode: 'BFF_SELECT_EXAM_ACCOUNT_ERROR',
		});
	}
}
