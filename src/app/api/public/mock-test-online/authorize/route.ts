import { NextRequest } from 'next/server';

import { proxyMockTestOnlineAuthorizePost } from '@/lib/public-mock-test-online/gateway-public-proxy';
import { stripClientIdentityClaims } from '@/features/portal-mock-test/server/resolve-mto-caller-identity.server';

export async function POST(req: NextRequest) {
	const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
	return proxyMockTestOnlineAuthorizePost(
		req,
		'authorize',
		stripClientIdentityClaims(body),
	);
}
