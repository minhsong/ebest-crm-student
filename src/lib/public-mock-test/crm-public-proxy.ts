/**
 * Proxy POST đăng ký thi thử → CRM `/api/v1/public/mock-test/registrations`.
 * GET sessions/options chỉ gọi từ server (`fetch-public-mock-test.server.ts`).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import {
	MSG_CRM_CONFIG,
	MSG_CRM_NETWORK,
	unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';

const JSON_HEADERS: HeadersInit = {
	'Content-Type': 'application/json',
	Accept: 'application/json',
};

function forwardOriginHeaders(req: NextRequest): HeadersInit {
	const headers: Record<string, string> = {};
	const origin = req.headers.get('origin');
	const referer = req.headers.get('referer');
	if (origin) headers['Origin'] = origin;
	if (referer) headers['Referer'] = referer;
	return headers;
}

export async function proxyPublicMockTestPost(
	req: NextRequest,
	path: string,
	body: unknown,
	errorFallback: string,
): Promise<NextResponse> {
	const apiBase = getApiBaseUrl();
	if (!apiBase) {
		return NextResponse.json({ message: MSG_CRM_CONFIG }, { status: 500 });
	}
	const url = `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test/${path}`;
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { ...JSON_HEADERS, ...forwardOriginHeaders(req) },
			body: JSON.stringify(body),
		});
		const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok) {
			return NextResponse.json(
				mapMockTestBffErrorForClient(data, res.status, errorFallback),
				{ status: res.status },
			);
		}
		return NextResponse.json(unwrapCrmResponseBody(data) ?? data);
	} catch {
		return NextResponse.json({ message: MSG_CRM_NETWORK }, { status: 502 });
	}
}
