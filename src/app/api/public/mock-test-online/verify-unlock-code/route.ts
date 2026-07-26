import { NextRequest } from 'next/server';
import { proxyMockTestOnlineGatewayPost } from '@/lib/public-mock-test-online/gateway-public-proxy';
import { stripClientIdentityClaims } from '@/features/portal-mock-test/server/resolve-mto-caller-identity.server';

export async function POST(req: NextRequest) {
	const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
	return proxyMockTestOnlineGatewayPost(
		req,
		'verify-unlock-code',
		stripClientIdentityClaims(body),
		'Không xác minh được mã làm bài.',
	);
}
