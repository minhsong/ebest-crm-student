import { NextResponse } from 'next/server';
import { resolveConfirmSessionOwnership } from '@/features/portal-mock-test/server/assert-confirm-session-ownership.server';
import { proxyMockTestOnlineGatewayGet } from '@/lib/public-mock-test-online/gateway-public-proxy';

type RouteContext = { params: Promise<{ pendingRegistrationId: string }> };

export async function GET(_req: Request, context: RouteContext) {
	const { pendingRegistrationId } = await context.params;
	const id = pendingRegistrationId?.trim();
	if (!id) {
		return NextResponse.json({ message: 'Thiếu mã đăng ký.' }, { status: 400 });
	}

	const ownership = await resolveConfirmSessionOwnership(id);
	if (!ownership.ok) {
		return NextResponse.json(
			{
				message: ownership.message,
				errorCode: 'SESSION_MISMATCH',
			},
			{ status: ownership.status },
		);
	}

	const qs = new URLSearchParams({
		funnelSessionId: ownership.funnelSessionId,
	});
	return proxyMockTestOnlineGatewayGet(
		`pending/${encodeURIComponent(id)}/status?${qs.toString()}`,
		'Không tìm thấy đăng ký hoặc đã hết hạn.',
	);
}
