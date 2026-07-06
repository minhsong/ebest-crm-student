import { NextRequest, NextResponse } from 'next/server';
import {
	buildGatewayServiceHeaders,
	getSocialGatewayConfig,
	gatewayConfigErrorResponse,
} from '@/lib/social-gateway-bff.util';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { applyMockTestOnlinePendingLeadCookie } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';

/** Fast path retake (BL-Q4): lead cookie → GW bootstrap pending → select-exam. */
export async function GET(request: NextRequest) {
	const session = await resolvePortalSessionFromCookies();
	if (session.actor !== 'lead') {
		return NextResponse.redirect(new URL('/mock-test-online/register?new=1', request.url));
	}

	const cfg = getSocialGatewayConfig();
	if (!cfg) {
		return gatewayConfigErrorResponse('mock-test-online.bootstrap-retake');
	}

	const url = `${cfg.baseUrl}/api/v1/internal/mock-test-online/leads/${encodeURIComponent(session.omniLeadId)}/bootstrap-lead-pending`;
	const res = await fetch(url, {
		method: 'POST',
		headers: buildGatewayServiceHeaders(cfg),
		cache: 'no-store',
	});
	const data = (await res.json().catch(() => ({}))) as {
		pendingLeadId?: string;
		message?: string;
	};
	if (!res.ok || !data.pendingLeadId?.trim()) {
		if (res.status === 403) {
			return NextResponse.redirect(
				new URL('/lead/tests?notice=attempt_limit', request.url),
			);
		}
		const message =
			typeof data.message === 'string'
				? data.message
				: 'Không khởi tạo được phiên thi lại. Vui lòng thử đăng ký lại.';
		return NextResponse.json(
			mapMockTestBffErrorForClient(data, res.status || 502, message),
			{ status: res.status || 502 },
		);
	}

	const pendingLeadId = data.pendingLeadId.trim();
	const target = new URL('/mock-test-online/select-exam', request.url);
	target.searchParams.set('lead', pendingLeadId);
	const next = NextResponse.redirect(target);
	applyMockTestOnlinePendingLeadCookie(next, pendingLeadId);
	return next;
}
