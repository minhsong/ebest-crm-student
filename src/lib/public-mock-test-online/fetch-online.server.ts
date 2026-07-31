import { loadLoggedInCustomerContactFromSession } from '@/lib/portal-auth/portal-me-contact.server';
import type {
	MockTestOnlineCampaign,
	MockTestOnlineCampaignsResponse,
	MockTestOnlineLeadRegisterPageData,
	MockTestOnlineSelectExamPageData,
} from '@/lib/public-mock-test-online/types';
import {
	fetchGatewayMockTestOnlineCampaign,
	fetchGatewayMockTestOnlineCampaigns,
	isGatewaySsrConfigured,
} from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';
import { fetchPublicMockTestCrmJson } from '@/lib/public-mock-test-online/proxy-public-mock-test-crm.server';
import { mtoServerDebug } from '@/lib/public-mock-test-online/mock-test-online-debug';

/** Fallback CRM khi Gateway chưa cấu hình hoặc cache miss — P2-c secondary only. */
async function fetchCrmOnlineFallback<T>(
	path: string,
	fallbackError: string,
): Promise<{ data: T | null; error: string | null }> {
	mtoServerDebug('mto.campaigns.fallback_crm', { path });
	const result = await fetchPublicMockTestCrmJson<T>({
		path,
		logContext: 'mto.campaigns.fallback_crm',
	});
	if (result.configMissing) {
		return { data: null, error: 'Cấu hình hệ thống chưa đúng.' };
	}
	if (!result.ok) {
		return {
			data: null,
			error: result.errorMessage ?? fallbackError,
		};
	}
	return {
		data: result.data,
		error: null,
	};
}

async function fetchCampaignsSsr(): Promise<{
	data: MockTestOnlineCampaignsResponse | null;
	error: string | null;
}> {
	// P2-c: GW primary
	if (isGatewaySsrConfigured()) {
		const gw = await fetchGatewayMockTestOnlineCampaigns();
		if (gw.data?.campaigns) return gw;
		mtoServerDebug('mto.campaigns.gw_empty_or_error', {
			error: gw.error ?? null,
		});
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
	return loadLoggedInCustomerContactFromSession();
}

/** B1 — trang đăng ký nhanh: chỉ contact (tags ở complete-profile sau thi). */
export async function loadMockTestOnlineLeadRegisterPageData(): Promise<MockTestOnlineLeadRegisterPageData> {
	const initialContact = await loadLoggedInStudentContact();
	return { initialContact };
}

/** B2 — trang chọn bài thi: danh sách chiến dịch từ Gateway cache (CRM fallback). */
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
		typePresentations: campaignsRes.data?.typePresentations ?? [],
		selectedCampaign,
		campaignsError: campaignsRes.error,
	};
}
