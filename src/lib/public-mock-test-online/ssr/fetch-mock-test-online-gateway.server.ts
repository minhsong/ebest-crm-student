/**
 * SSR fetch mock-test-online read-model từ Social Gateway (giảm tải CRM).
 */
import type { PublicRegistrationOptions } from '@/lib/public-mock-test/types';
import type {
	MockTestOnlineCampaign,
	MockTestOnlineCampaignsResponse,
} from '@/lib/public-mock-test-online/types';

function resolveGatewayBaseUrl(): string | null {
	const baseUrl = process.env.SOCIAL_GATEWAY_BASE_URL?.replace(/\/$/, '') ?? '';
	return baseUrl || null;
}

async function fetchGatewayPublic<T>(
	path: string,
	fallbackError: string,
): Promise<{ data: T | null; error: string | null }> {
	const baseUrl = resolveGatewayBaseUrl();
	if (!baseUrl) {
		return { data: null, error: 'Cấu hình Gateway chưa sẵn sàng.' };
	}
	const url = `${baseUrl}/api/v1/public/mock-test-online/${path}`;
	try {
		const res = await fetch(url, {
			headers: { Accept: 'application/json' },
			cache: 'no-store',
		});
		const raw = (await res.json().catch(() => ({}))) as Record<string, unknown> & {
			message?: string;
		};
		if (!res.ok) {
			const msg = raw.message;
			return {
				data: null,
				error: typeof msg === 'string' && msg.trim() ? msg.trim() : fallbackError,
			};
		}
		return { data: raw as T, error: null };
	} catch {
		return { data: null, error: 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
	}
}

export async function fetchGatewayMockTestOnlineCampaigns(): Promise<{
	data: MockTestOnlineCampaignsResponse | null;
	error: string | null;
}> {
	return fetchGatewayPublic<MockTestOnlineCampaignsResponse>(
		'campaigns',
		'Không tải được chiến dịch thi thử online.',
	);
}

export async function fetchGatewayMockTestOnlineCampaign(
	sessionId: number,
): Promise<{ data: MockTestOnlineCampaign | null; error: string | null }> {
	return fetchGatewayPublic<MockTestOnlineCampaign>(
		`campaigns/${sessionId}`,
		'Không tìm thấy chiến dịch.',
	);
}

export async function fetchGatewayMockTestOnlineRegistrationOptions(): Promise<{
	data: PublicRegistrationOptions | null;
	error: string | null;
}> {
	return fetchGatewayPublic<PublicRegistrationOptions>(
		'registration-options',
		'Không tải được danh mục mô tả.',
	);
}

export function isGatewaySsrConfigured(): boolean {
	return Boolean(resolveGatewayBaseUrl());
}

export type GatewayLeadPendingAttemptContext = {
	omniLeadId: string;
	primaryPhoneE164: string;
};

export type GatewayFunnelSessionPublic = {
	funnelSessionId: string;
	pendingLeadId: string;
	omniLeadId: string;
	resumeStep: 'select' | 'verify';
	status: 'lead_registered' | 'awaiting_verify';
	selectedSessionId: number | null;
	pendingRegistrationId: string | null;
	primaryPhoneE164: string;
};

export async function fetchGatewayLeadPendingAttemptContext(
	pendingLeadId: string,
): Promise<GatewayLeadPendingAttemptContext | null> {
	const id = pendingLeadId.trim();
	if (!id) return null;
	const res = await fetchGatewayPublic<GatewayLeadPendingAttemptContext>(
		`lead-pending/${encodeURIComponent(id)}/attempt-context`,
		'Không tải được thông tin đăng ký.',
	);
	return res.data;
}

export async function fetchGatewayFunnelSession(
	funnelSessionId: string,
): Promise<GatewayFunnelSessionPublic | null> {
	const id = funnelSessionId.trim();
	if (!id) return null;
	const res = await fetchGatewayPublic<GatewayFunnelSessionPublic>(
		`funnel-session/${encodeURIComponent(id)}`,
		'Không tải được phiên đăng ký.',
	);
	return res.data;
}
