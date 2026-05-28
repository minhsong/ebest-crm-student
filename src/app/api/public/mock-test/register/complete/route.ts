import type { NextRequest } from 'next/server';
import { proxyPublicMockTestPost } from '@/lib/public-mock-test/crm-public-proxy';

export async function POST(req: NextRequest) {
	const body = await req.json().catch(() => ({}));
	return proxyPublicMockTestPost(
		req,
		'registrations/complete',
		body,
		'Không thể hoàn tất đăng ký. Vui lòng thử lại.',
	);
}
