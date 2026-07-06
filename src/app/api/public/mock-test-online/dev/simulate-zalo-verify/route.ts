import { NextRequest, NextResponse } from 'next/server';
import { proxyMockTestOnlineGatewayPost } from '@/lib/public-mock-test-online/gateway-public-proxy';

export async function POST(req: NextRequest) {
	if (process.env.NODE_ENV === 'production') {
		return NextResponse.json({ message: 'Not found' }, { status: 404 });
	}
	const body = await req.json().catch(() => ({}));
	return proxyMockTestOnlineGatewayPost(
		req,
		'dev/simulate-zalo-verify',
		body,
		'Không mô phỏng được xác minh Zalo.',
	);
}
