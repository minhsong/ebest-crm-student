import { NextRequest, NextResponse } from 'next/server';
import {
	buildGatewayServiceHeaders,
	getSocialGatewayConfig,
	gatewayConfigErrorResponse,
} from '@/lib/social-gateway-bff.util';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';
import { getMockTestOnlineFunnelSessionId } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { funnelOwnsSelectRequest } from '@/features/portal-mock-test/server/assert-confirm-session-ownership.server';

function forwardOriginHeaders(req: NextRequest): Record<string, string> {
	const headers: Record<string, string> = {};
	const origin = req.headers.get('origin');
	const referer = req.headers.get('referer');
	if (origin) headers.Origin = origin;
	if (referer) headers.Referer = referer;
	return headers;
}

/**
 * POST select-exam — giữ cookie FunnelSession (`mto_funnel_session` / dual `mto_pending_lead`).
 * Phase 1: select promote Redis `resumeStep=verify`, không xóa continuity (ADR FunnelSession).
 */
export async function POST(req: NextRequest) {
	const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
	const pendingLeadId =
		typeof body.pendingLeadId === 'string' ? body.pendingLeadId.trim() : '';
	const funnelSessionId = getMockTestOnlineFunnelSessionId()?.trim() || '';
	if (!funnelOwnsSelectRequest(funnelSessionId, pendingLeadId)) {
		return NextResponse.json(
			{
				message: 'Phiên đăng ký không khớp. Vui lòng bắt đầu lại.',
				errorCode: 'SESSION_MISMATCH',
			},
			{ status: 403 },
		);
	}

	const cfg = getSocialGatewayConfig();
	if (!cfg) {
		return gatewayConfigErrorResponse('mock-test-online.select-exam');
	}
	const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/select-exam`;
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: buildGatewayServiceHeaders(cfg, forwardOriginHeaders(req)),
			body: JSON.stringify(body),
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
	} catch {
		return NextResponse.json(
			{ message: STUDENT_SAFE_USER_MESSAGES.generic },
			{ status: 502 },
		);
	}
}
