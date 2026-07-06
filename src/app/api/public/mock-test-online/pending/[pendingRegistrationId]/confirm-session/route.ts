import { proxyMockTestOnlineGatewayGet } from '@/lib/public-mock-test-online/gateway-public-proxy';

type RouteContext = { params: Promise<{ pendingRegistrationId: string }> };

export async function GET(_req: Request, context: RouteContext) {
	const { pendingRegistrationId } = await context.params;
	const id = pendingRegistrationId?.trim();
	if (!id) {
		return Response.json({ message: 'Thiếu mã phiên xác minh.' }, { status: 400 });
	}
	return proxyMockTestOnlineGatewayGet(
		`pending/${encodeURIComponent(id)}/confirm-session`,
		'Không tìm thấy phiên xác minh hoặc đã hết hạn.',
	);
}
