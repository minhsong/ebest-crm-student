import { NextRequest, NextResponse } from 'next/server';
import { mockTestBffCatchResponse } from '@/lib/public-mock-test-online/mock-test-bff-catch-response';
import {
	gatewayConfigErrorResponse,
	getSocialGatewayConfig,
	proxyGatewayJsonResponse,
} from '@/lib/social-gateway-bff.util';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';
import {
	mintMtoPortalAuthorizeToken,
	MTO_REGISTRATION_ID_HEADER,
	parseRegistrationIdHeader,
} from '@/lib/public-mock-test-online/mint-mto-portal-authorize-token.server';

const PORTAL_AUTH_HEADER = 'X-Mock-Test-Portal-Authorize-Token';

type RouteContext = { params: Promise<{ path: string[] }> };

function stripPortalTokenFromSearch(search: string): string {
	if (!search) return '';
	const params = new URLSearchParams(
		search.startsWith('?') ? search.slice(1) : search,
	);
	params.delete('portalAuthorizeToken');
	const next = params.toString();
	return next ? `?${next}` : '';
}

function registrationIdFromSearch(search: string): number | null {
	const params = new URLSearchParams(
		search.startsWith('?') ? search.slice(1) : search,
	);
	const raw = params.get('registrationId')?.trim() || '';
	const n = Number(raw);
	return Number.isFinite(n) && n >= 1 ? n : null;
}

async function proxyQuiz(
	req: NextRequest,
	segments: string[],
): Promise<NextResponse> {
	const cfg = getSocialGatewayConfig();
	if (!cfg) {
		return gatewayConfigErrorResponse('mock-test-online.quiz-runtime');
	}
	const subPath = segments.join('/');
	const search = stripPortalTokenFromSearch(req.nextUrl.search || '');
	const url = `${cfg.baseUrl}/api/v1/public/mock-test-online/quiz/${subPath}${search}`;
	const method = req.method.toUpperCase();

	let registrationId =
		parseRegistrationIdHeader(req.headers.get(MTO_REGISTRATION_ID_HEADER)) ||
		registrationIdFromSearch(req.nextUrl.search || '');

	let bodyText = '';
	if (method !== 'GET' && method !== 'HEAD') {
		bodyText = await req.text();
		if (bodyText && !registrationId) {
			try {
				const obj = JSON.parse(bodyText) as Record<string, unknown>;
				const n = Number(obj.registrationId);
				if (Number.isFinite(n) && n >= 1) registrationId = n;
				delete obj.portalAuthorizeToken;
				bodyText = JSON.stringify(obj);
			} catch {
				// giữ nguyên body
			}
		} else if (bodyText) {
			try {
				const obj = JSON.parse(bodyText) as Record<string, unknown>;
				delete obj.portalAuthorizeToken;
				bodyText = JSON.stringify(obj);
			} catch {
				// ignore
			}
		}
	}

	const minted = registrationId
		? await mintMtoPortalAuthorizeToken({ registrationId })
		: null;

	const headers: Record<string, string> = {
		Accept: 'application/json',
		'Content-Type': 'application/json',
	};
	if (minted?.portalAuthorizeToken) {
		headers[PORTAL_AUTH_HEADER] = minted.portalAuthorizeToken;
	}
	const origin = req.headers.get('origin');
	const referer = req.headers.get('referer');
	if (origin) headers.Origin = origin;
	if (referer) headers.Referer = referer;

	try {
		const init: RequestInit = {
			method,
			headers,
			cache: 'no-store',
		};
		if (method !== 'GET' && method !== 'HEAD' && bodyText) {
			init.body = bodyText;
		}
		const res = await fetch(url, init);
		return proxyGatewayJsonResponse(res, STUDENT_SAFE_USER_MESSAGES.generic);
	} catch (error) {
		return mockTestBffCatchResponse(error, {
			errorCode: 'BFF_QUIZ_RUNTIME_ERROR',
			message: STUDENT_SAFE_USER_MESSAGES.network,
			logContext: 'mto.bff.quiz-runtime',
			path: '/api/public/mock-test-online/quiz-runtime',
			method,
		});
	}
}

export async function GET(req: NextRequest, ctx: RouteContext) {
	const { path } = await ctx.params;
	return proxyQuiz(req, path);
}

export async function POST(req: NextRequest, ctx: RouteContext) {
	const { path } = await ctx.params;
	return proxyQuiz(req, path);
}

export async function PATCH(req: NextRequest, ctx: RouteContext) {
	const { path } = await ctx.params;
	return proxyQuiz(req, path);
}
