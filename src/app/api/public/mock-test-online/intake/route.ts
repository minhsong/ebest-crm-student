import { NextRequest, NextResponse } from 'next/server';

import {

	getSocialGatewayConfig,

	gatewayConfigErrorResponse,

} from '@/lib/social-gateway-bff.util';

import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';

import { applyMockTestOnlineFunnelSessionCookie } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';

export async function POST(req: NextRequest) {

	const body = await req.json().catch(() => ({}));

	const cfg = getSocialGatewayConfig();

	if (!cfg) {

		return gatewayConfigErrorResponse('mock-test-online.intake');

	}

	const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/intake`;

	try {

		const origin = req.headers.get('origin');

		const referer = req.headers.get('referer');

		const headers: Record<string, string> = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		};

		if (origin) headers.Origin = origin;

		if (referer) headers.Referer = referer;



		const res = await fetch(url, {

			method: 'POST',

			headers,

			body: JSON.stringify(body),

			cache: 'no-store',

		});

		const data = (await res.json().catch(() => ({}))) as {

			pendingLeadId?: string;

			message?: string;

		};



		if (!res.ok) {

			return NextResponse.json(
				mapMockTestBffErrorForClient(
					data,
					res.status,
					'Đăng ký thi thử online thất bại. Vui lòng thử lại.',
				),
				{ status: res.status },
			);

		}



		const nextRes = NextResponse.json(data, { status: res.status });

		const pendingLeadId = data.pendingLeadId?.trim() ?? '';

		if (pendingLeadId) {

			applyMockTestOnlineFunnelSessionCookie(nextRes, pendingLeadId);

		}

		return nextRes;

	} catch {

		return NextResponse.json(

			{ message: STUDENT_SAFE_USER_MESSAGES.generic },

			{ status: 502 },

		);

	}

}

