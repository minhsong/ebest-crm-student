/**
 * Server-only: proxy public mock-test-online → Social Gateway.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
	gatewayConfigErrorResponse,
	getSocialGatewayConfig,
	proxyGatewayJsonResponse,
} from '@/lib/social-gateway-bff.util';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';
import {
	applyMockTestOnlineExamAuthCookie,
	stripPortalAuthorizeTokenFromGatewayBody,
} from '@/lib/public-mock-test-online/mock-test-online-exam-auth-cookie';
import { mtoServerDebug } from '@/lib/public-mock-test-online/mock-test-online-debug';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';

const JSON_HEADERS: HeadersInit = {
	Accept: 'application/json',
	'Content-Type': 'application/json',
};

function forwardOriginHeaders(req: NextRequest): HeadersInit {
	const headers: Record<string, string> = {};
	const origin = req.headers.get('origin');
	const referer = req.headers.get('referer');
	if (origin) headers.Origin = origin;
	if (referer) headers.Referer = referer;
	return headers;
}

export async function proxyMockTestOnlineGatewayPost(
	req: NextRequest,
	path: string,
	body: unknown,
	fallbackError: string,
): Promise<NextResponse> {
	const cfg = getSocialGatewayConfig();
	if (!cfg) {
		return gatewayConfigErrorResponse('mock-test-online.gateway.post');
	}
	const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/${path}`;
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { ...JSON_HEADERS, ...forwardOriginHeaders(req) },
			body: JSON.stringify(body),
			cache: 'no-store',
		});
		return proxyGatewayJsonResponse(res, STUDENT_SAFE_USER_MESSAGES.generic);
	} catch {
		return NextResponse.json(
			{ message: 'Không thể kết nối máy chủ. Vui lòng thử lại.' },
			{ status: 502 },
		);
	}
}

/** Authorize / authorize-resume — set httpOnly cookie, không trả token trong JSON. */
export async function proxyMockTestOnlineAuthorizePost(
	req: NextRequest,
	path: 'authorize' | 'authorize-resume',
	body: unknown,
): Promise<NextResponse> {
	const cfg = getSocialGatewayConfig();
	if (!cfg) {
		return gatewayConfigErrorResponse('mock-test-online.gateway.authorize');
	}
	const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/${path}`;
	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { ...JSON_HEADERS, ...forwardOriginHeaders(req) },
			body: JSON.stringify(body),
			cache: 'no-store',
		});
		const data = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
			message?: string;
			allowed?: boolean;
			portalAuthorizeToken?: string;
			portalAuthorizeExpiresAt?: string;
		};
		if (!res.ok) {
			return NextResponse.json(
				mapMockTestBffErrorForClient(
					data,
					res.status,
					STUDENT_SAFE_USER_MESSAGES.generic,
				),
				{ status: res.status },
			);
		}
		const token =
			typeof data.portalAuthorizeToken === 'string'
				? data.portalAuthorizeToken.trim()
				: '';
		const expiresAt =
			typeof data.portalAuthorizeExpiresAt === 'string'
				? data.portalAuthorizeExpiresAt
				: undefined;
		let response: NextResponse = NextResponse.json(
			stripPortalAuthorizeTokenFromGatewayBody(data),
			{ status: res.status },
		);
		if (data.allowed && token) {
			response = applyMockTestOnlineExamAuthCookie(response, {
				portalAuthorizeToken: token,
				portalAuthorizeExpiresAt: expiresAt,
			});
		}
		mtoServerDebug(`auth.${path}`, {
			allowed: data.allowed === true,
			registrationId: data.registrationId ?? null,
			sessionId: data.sessionId ?? null,
			formPublicId: data.formPublicId ?? null,
			status: res.status,
		});
		return response;
	} catch {
		return NextResponse.json(
			{ message: 'Không thể kết nối máy chủ. Vui lòng thử lại.' },
			{ status: 502 },
		);
	}
}

export async function proxyMockTestOnlineGatewayGet(
	path: string,
	fallbackError: string,
): Promise<NextResponse> {
	const cfg = getSocialGatewayConfig();
	if (!cfg) {
		return gatewayConfigErrorResponse('mock-test-online.gateway.get');
	}
	const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/${path}`;
	try {
		const res = await fetch(url, {
			method: 'GET',
			headers: JSON_HEADERS,
			cache: 'no-store',
		});
		return proxyGatewayJsonResponse(res, STUDENT_SAFE_USER_MESSAGES.generic);
	} catch {
		return NextResponse.json(
			{ message: 'Không thể kết nối máy chủ. Vui lòng thử lại.' },
			{ status: 502 },
		);
	}
}
