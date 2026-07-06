import { proxyMockTestOnlineGatewayGet } from '@/lib/public-mock-test-online/gateway-public-proxy';

type RouteContext = { params: Promise<{ pendingRegistrationId: string }> };

export async function GET(
	_req: Request,
	context: RouteContext,
) {
	const { pendingRegistrationId } = await context.params;
	const id = pendingRegistrationId?.trim();
	if (!id) {
		return Response.json({ message: 'Thiếu mã đăng ký.' }, { status: 400 });
	}
	return proxyMockTestOnlineGatewayGet(
		`pending/${encodeURIComponent(id)}/status`,
		'Không tìm thấy đăng ký hoặc đã hết hạn.',
	);
}
