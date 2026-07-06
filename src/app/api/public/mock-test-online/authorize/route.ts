import { NextRequest } from 'next/server';

import { proxyMockTestOnlineAuthorizePost } from '@/lib/public-mock-test-online/gateway-public-proxy';



export async function POST(req: NextRequest) {

	const body = await req.json().catch(() => ({}));

	return proxyMockTestOnlineAuthorizePost(req, 'authorize', body);

}

