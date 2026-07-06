import { NextRequest, NextResponse } from 'next/server';

import {

	gatewayConfigErrorResponse,

	getSocialGatewayConfig,

	proxyGatewayJsonResponse,

} from '@/lib/social-gateway-bff.util';

import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';

import { getMockTestOnlinePortalAuthorizeTokenFromCookie } from '@/lib/public-mock-test-online/mock-test-online-exam-auth-cookie';



const JSON_HEADERS: HeadersInit = {

	Accept: 'application/json',

	'Content-Type': 'application/json',

};



const PORTAL_AUTH_HEADER = 'X-Mock-Test-Portal-Authorize-Token';



type RouteContext = { params: Promise<{ path: string[] }> };



function stripPortalTokenFromSearch(search: string): string {

	if (!search) return '';

	const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

	params.delete('portalAuthorizeToken');

	const next = params.toString();

	return next ? `?${next}` : '';

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

	const cookieToken = getMockTestOnlinePortalAuthorizeTokenFromCookie();

	const headers: Record<string, string> = {

		Accept: 'application/json',

		'Content-Type': 'application/json',

	};

	if (cookieToken) {

		headers[PORTAL_AUTH_HEADER] = cookieToken;

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

		if (method !== 'GET' && method !== 'HEAD') {

			let body = await req.text();

			if (body && cookieToken) {

				try {

					const obj = JSON.parse(body) as Record<string, unknown>;

					delete obj.portalAuthorizeToken;

					body = JSON.stringify(obj);

				} catch {

					// giữ nguyên body nếu không phải JSON

				}

			}

			if (body) init.body = body;

		}

		const res = await fetch(url, init);

		return proxyGatewayJsonResponse(res, STUDENT_SAFE_USER_MESSAGES.generic);

	} catch {

		return NextResponse.json(

			{ message: STUDENT_SAFE_USER_MESSAGES.network },

			{ status: 502 },

		);

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

