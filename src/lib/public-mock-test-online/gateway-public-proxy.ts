/**
 * Server-only: proxy public mock-test-online → Social Gateway.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
	buildGatewayServiceHeaders,
	gatewayConfigErrorResponse,
	getSocialGatewayConfig,
	proxyGatewayJsonResponse,
} from '@/lib/social-gateway-bff.util';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';
import {
	clearMockTestOnlineExamAuthCookie,
	stripPortalAuthorizeTokenFromGatewayBody,
} from '@/lib/public-mock-test-online/mock-test-online-exam-auth-cookie';
import { clearMockTestOnlineFunnelSessionCookie } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { mtoServerDebug } from '@/lib/public-mock-test-online/mock-test-online-debug';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { mockTestBffCatchResponse } from '@/lib/public-mock-test-online/mock-test-bff-catch-response';
import { MOCK_TEST_ONLINE_FUNNEL_TERMINAL_DENY_CODE_SET } from '@ebest/crm-api-types/student/mock-test-online';
import { mtoOutboundRequestHeaders } from '@/lib/public-mock-test-online/mto-layer-error';
import { withMtoBffRequest } from '@/lib/public-mock-test-online/with-mto-bff-request';

/** Deny terminal — không giữ funnel cookie để resume. */
function shouldClearFunnelCookieOnAuthorizeDeny(
	data: Record<string, unknown>,
): boolean {
	const code =
		typeof data.errorCode === 'string' ? data.errorCode.trim() : '';
	return Boolean(code) && MOCK_TEST_ONLINE_FUNNEL_TERMINAL_DENY_CODE_SET.has(code);
}

function forwardOriginHeaders(req: NextRequest): Record<string, string> {
	const headers: Record<string, string> = {
		...mtoOutboundRequestHeaders(),
	};
	const origin = req.headers.get('origin');
	const referer = req.headers.get('referer');
	if (origin) headers.Origin = origin;
	if (referer) headers.Referer = referer;
	const inbound = req.headers.get('x-request-id')?.trim();
	if (inbound) headers['X-Request-Id'] = inbound;
	return headers;
}

export async function proxyMockTestOnlineGatewayPost(
	req: NextRequest,
	path: string,
	body: unknown,
	fallbackError: string,
): Promise<NextResponse> {
	return withMtoBffRequest(req, async (requestId) => {
		const cfg = getSocialGatewayConfig();
		if (!cfg) {
			return gatewayConfigErrorResponse('mock-test-online.gateway.post');
		}
		const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/${path}`;
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: buildGatewayServiceHeaders(cfg, forwardOriginHeaders(req)),
				body: JSON.stringify(body),
				cache: 'no-store',
			});
			return proxyGatewayJsonResponse(res, STUDENT_SAFE_USER_MESSAGES.generic);
		} catch (error) {
			return mockTestBffCatchResponse(error, {
				message: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
				errorCode: 'BFF_UPSTREAM_ERROR',
				module: 'mto-funnel',
				operation: `gateway.post.${path}`,
				path: `/api/public/mock-test-online/${path}`,
				method: 'POST',
				requestId,
			});
		}
	});
}

/** Authorize / authorize-resume — strip token khỏi JSON; không set cookie capability (PO-D25). */
export async function proxyMockTestOnlineAuthorizePost(
	req: NextRequest,
	path: 'authorize' | 'authorize-resume',
	body: unknown,
): Promise<NextResponse> {
	return withMtoBffRequest(req, async (requestId) => {
		const cfg = getSocialGatewayConfig();
		if (!cfg) {
			return gatewayConfigErrorResponse('mock-test-online.gateway.authorize');
		}
		const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/${path}`;
		try {
			const res = await fetch(url, {
				method: 'POST',
				headers: buildGatewayServiceHeaders(cfg, forwardOriginHeaders(req)),
				body: JSON.stringify(body),
				cache: 'no-store',
			});
			const data = (await res.json().catch(() => ({}))) as Record<
				string,
				unknown
			> & {
				message?: string;
				allowed?: boolean;
				portalAuthorizeToken?: string;
				portalAuthorizeExpiresAt?: string;
			};
			if (!res.ok) {
				let response = NextResponse.json(
					mapMockTestBffErrorForClient(
						data,
						res.status,
						STUDENT_SAFE_USER_MESSAGES.generic,
					),
					{ status: res.status },
				);
				if (shouldClearFunnelCookieOnAuthorizeDeny(data)) {
					response = clearMockTestOnlineFunnelSessionCookie(response);
				}
				response = clearMockTestOnlineExamAuthCookie(response);
				mtoServerDebug(`auth.${path}.deny`, {
					status: res.status,
					errorCode:
						typeof data.errorCode === 'string' ? data.errorCode : null,
					requestId,
				});
				return response;
			}
			let response: NextResponse = NextResponse.json(
				stripPortalAuthorizeTokenFromGatewayBody(data),
				{ status: res.status },
			);
			if (data.allowed === true) {
				// Capability mint lại trên BFF quiz-runtime / exam-auth-token — không cookie.
				response = clearMockTestOnlineExamAuthCookie(response);
				response = clearMockTestOnlineFunnelSessionCookie(response);
			} else if (shouldClearFunnelCookieOnAuthorizeDeny(data)) {
				response = clearMockTestOnlineFunnelSessionCookie(response);
				response = clearMockTestOnlineExamAuthCookie(response);
			}
			mtoServerDebug(`auth.${path}`, {
				allowed: data.allowed === true,
				registrationId: data.registrationId ?? null,
				sessionId: data.sessionId ?? null,
				formPublicId: data.formPublicId ?? null,
				status: res.status,
				requestId,
			});
			return response;
		} catch (error) {
			return mockTestBffCatchResponse(error, {
				message: 'Không thể kết nối máy chủ. Vui lòng thử lại.',
				errorCode: 'BFF_AUTHORIZE_ERROR',
				module: 'mto-exam-capability',
				operation: `gateway.${path}`,
				path: `/api/public/mock-test-online/${path}`,
				method: 'POST',
				requestId,
			});
		}
	});
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
			headers: buildGatewayServiceHeaders(cfg, mtoOutboundRequestHeaders()),
			cache: 'no-store',
		});
		return proxyGatewayJsonResponse(res, STUDENT_SAFE_USER_MESSAGES.generic);
	} catch (error) {
		return mockTestBffCatchResponse(error, {
			message:
				fallbackError || 'Không thể kết nối máy chủ. Vui lòng thử lại.',
			errorCode: 'BFF_UPSTREAM_ERROR',
			module: 'mto-funnel',
			operation: `gateway.get.${path}`,
			path: `/api/public/mock-test-online/${path}`,
			method: 'GET',
		});
	}
}
