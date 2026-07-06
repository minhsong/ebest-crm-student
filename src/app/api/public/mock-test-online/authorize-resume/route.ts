import { NextRequest } from 'next/server';

import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { proxyMockTestOnlineAuthorizePost } from '@/lib/public-mock-test-online/gateway-public-proxy';



export async function POST(req: NextRequest) {

	const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

	const session = await resolvePortalSessionFromCookies();

	const enriched =
		session.actor === 'lead'
			? { ...body, omniLeadId: session.omniLeadId }
			: body;

	return proxyMockTestOnlineAuthorizePost(req, 'authorize-resume', enriched);

}

