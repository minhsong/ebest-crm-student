import { NextRequest } from 'next/server';
import { proxyMockTestOnlineGatewayPost } from '@/lib/public-mock-test-online/gateway-public-proxy';

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => ({}));
	return proxyMockTestOnlineGatewayPost(
		req,
		'verify-unlock-code',
		body,
		'Không xác minh được mã làm bài.',
	);
}
