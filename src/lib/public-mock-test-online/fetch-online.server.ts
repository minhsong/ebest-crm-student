import { getApiBaseUrl } from '@/lib/env';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { parseStudentMeCustomerBrief } from '@/lib/parse-student-me-customer';
import { fetchStudentMeForSsr } from '@/lib/server/student-me';
import type { PublicRegistrationOptions } from '@/lib/public-mock-test/types';
import type {
	MockTestOnlineCampaign,
	MockTestOnlineCampaignsResponse,
	MockTestOnlineLeadRegisterPageData,
	MockTestOnlineSelectExamPageData,
} from '@/lib/public-mock-test-online/types';
import {
	fetchGatewayMockTestOnlineCampaign,
	fetchGatewayMockTestOnlineCampaigns,
	fetchGatewayMockTestOnlineRegistrationOptions,
	isGatewaySsrConfigured,
} from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';

function resolvePortalOrigin(): string {
	const configured = process.env.STUDENT_PORTAL_ORIGIN?.trim();
	if (configured) return configured.replace(/\/$/, '');
	const site =
		process.env.SITE_URL?.trim() ||
		process.env.NEXT_PUBLIC_APP_URL?.trim() ||
		'';
	if (site) return site.replace(/\/$/, '');
	return 'http://localhost:3000';
}

function crmOnlineHeaders(): HeadersInit {
	const origin = resolvePortalOrigin();
	const headers: Record<string, string> = {
		Accept: 'application/json',
		Origin: origin,
		Referer: `${origin}/mock-test-online/register`,
	};
	const serverToken = process.env.PUBLIC_REG_SERVER_TOKEN?.trim();
	if (serverToken) {
		headers['X-Public-Reg-Server-Token'] = serverToken;
	}
	return headers;
}

/** Fallback CRM khi Gateway chưa cấu hình hoặc cache miss. */
async function fetchCrmOnlineFallback<T>(
	path: string,
	fallbackError: string,
): Promise<{ data: T | null; error: string | null }> {
	const apiBase = getApiBaseUrl();
	if (!apiBase) {
		return { data: null, error: 'Cấu hình hệ thống chưa đúng.' };
	}
	const url = `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test-online/${path}`;
	try {
		const res = await fetch(url, {
			headers: crmOnlineHeaders(),
			cache: 'no-store',
		});
		const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
		if (!res.ok) {
			const msg = raw.message;
			return {
				data: null,
				error:
					typeof msg === 'string' && msg.trim() ? msg : fallbackError,
			};
		}
		return {
			data: (unwrapCrmResponseBody(raw) ?? raw) as T,
			error: null,
		};
	} catch {
		return { data: null, error: 'Không thể kết nối máy chủ. Vui lòng thử lại.' };
	}
}

async function fetchRegistrationOptionsSsr(): Promise<{
	data: PublicRegistrationOptions | null;
	error: string | null;
}> {
	if (isGatewaySsrConfigured()) {
		const gw = await fetchGatewayMockTestOnlineRegistrationOptions();
		if (gw.data?.groups) return gw;
	}
	return fetchCrmOnlineFallback<PublicRegistrationOptions>(
		'registration-options',
		'Không tải được danh mục mô tả.',
	);
}

async function fetchCampaignsSsr(): Promise<{
	data: MockTestOnlineCampaignsResponse | null;
	error: string | null;
}> {
	if (isGatewaySsrConfigured()) {
		const gw = await fetchGatewayMockTestOnlineCampaigns();
		if (gw.data?.campaigns) return gw;
	}
	return fetchCrmOnlineFallback<MockTestOnlineCampaignsResponse>(
		'campaigns',
		'Không tải được chiến dịch thi thử online.',
	);
}

async function fetchCampaignDetailSsr(
	sessionId: number,
): Promise<{ data: MockTestOnlineCampaign | null; error: string | null }> {
	if (isGatewaySsrConfigured()) {
		const gw = await fetchGatewayMockTestOnlineCampaign(sessionId);
		if (gw.data?.sessionId) return gw;
	}
	return fetchCrmOnlineFallback<MockTestOnlineCampaign>(
		`campaigns/${sessionId}`,
		'Không tìm thấy chiến dịch.',
	);
}

async function loadLoggedInStudentContact() {
	try {
		const payload = await fetchStudentMeForSsr();
		if (!payload) return null;
		const parsed = parseStudentMeCustomerBrief(payload?.customer ?? payload);
		if (!parsed) return null;
		return {
			displayName: parsed.fullName || undefined,
			primaryPhone: parsed.primaryPhone?.trim() || undefined,
			primaryEmail: parsed.primaryEmail?.trim() || undefined,
		};
	} catch {
		return null;
	}
}

/** B1 — trang đăng ký: profile options + contact (Gateway cache ưu tiên). */
export async function loadMockTestOnlineLeadRegisterPageData(): Promise<MockTestOnlineLeadRegisterPageData> {
	const [optionsRes, initialContact] = await Promise.all([
		fetchRegistrationOptionsSsr(),
		loadLoggedInStudentContact(),
	]);

	return {
		profileOptions: optionsRes.data ?? null,
		profileOptionsError: optionsRes.error,
		initialContact,
	};
}

/** B2 — trang chọn bài thi: danh sách chiến dịch từ Gateway cache. */
export async function loadMockTestOnlineSelectExamPageData(
	pendingLeadId: string | undefined,
	campaignId?: number,
): Promise<MockTestOnlineSelectExamPageData> {
	const campaignsRes = await fetchCampaignsSsr();
	const campaigns = campaignsRes.data?.campaigns ?? [];

	let selectedCampaign: MockTestOnlineCampaign | null = null;
	if (campaignId && Number.isFinite(campaignId)) {
		selectedCampaign =
			campaigns.find((c) => c.sessionId === campaignId) ?? null;
		if (!selectedCampaign) {
			const detail = await fetchCampaignDetailSsr(campaignId);
			selectedCampaign = detail.data;
		}
	} else if (campaigns.length === 1) {
		selectedCampaign = campaigns[0];
	}

	return {
		pendingLeadId: pendingLeadId?.trim() || null,
		campaigns,
		selectedCampaign,
		campaignsError: campaignsRes.error,
	};
}

/** @deprecated dùng loadMockTestOnlineLeadRegisterPageData + loadMockTestOnlineSelectExamPageData */
export async function loadMockTestOnlineRegisterPageData(campaignId?: number) {
	const lead = await loadMockTestOnlineLeadRegisterPageData();
	const exam = await loadMockTestOnlineSelectExamPageData(undefined, campaignId);
	return {
		...lead,
		campaigns: exam.campaigns,
		selectedCampaign: exam.selectedCampaign,
		campaignsError: exam.campaignsError,
	};
}
