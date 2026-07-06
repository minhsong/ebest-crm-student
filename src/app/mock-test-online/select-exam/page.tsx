import { MockTestOnlineSelectExamForm } from '@/components/public-mock-test-online/MockTestOnlineSelectExamForm';
import { MockTestOnlineSeoJsonLd } from '@/components/public-mock-test-online/MockTestOnlineSeoJsonLd';
import { loadMockTestOnlineSelectExamPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { getMockTestOnlinePendingLeadId } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { fetchMockTestOnlineSeo } from '@/lib/public-mock-test-online/seo/fetch-seo.server';
import { buildPageMetadata } from '@/lib/metadata';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { resolveSelectExamAttemptStatus } from '@/lib/public-mock-test-online/resolve-select-exam-attempt-status.server';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
	title: 'Chọn bài thi thử TOEIC online',
	description: 'Chọn bài thi sau khi đăng ký thi thử online Ebest.',
	path: '/mock-test-online/select-exam',
});

type PageProps = {
	searchParams: Promise<{ lead?: string; campaign?: string }>;
};

export default async function MockTestOnlineSelectExamPage({
	searchParams,
}: PageProps) {
	const sp = await searchParams;
	const pendingLeadId =
		sp.lead?.trim() || getMockTestOnlinePendingLeadId() || '';
	const campaignRaw = sp.campaign?.trim();
	const campaignId = campaignRaw ? parseInt(campaignRaw, 10) : undefined;

	const { campaigns, selectedCampaign, campaignsError } =
		await loadMockTestOnlineSelectExamPageData(
			pendingLeadId || undefined,
			Number.isFinite(campaignId) ? campaignId : undefined,
		);
	const seo = await fetchMockTestOnlineSeo();

	const session = await resolvePortalSessionFromCookies();
	const testTypeCode =
		selectedCampaign?.testTypeCode?.trim() ||
		campaigns[0]?.testTypeCode?.trim() ||
		'';
	const attemptStatus =
		testTypeCode && (pendingLeadId || session.actor === 'lead')
			? await resolveSelectExamAttemptStatus({
					session,
					pendingLeadId,
					testTypeCode,
					sessionId: selectedCampaign?.sessionId,
				})
			: null;

	return (
		<>
			<MockTestOnlineSeoJsonLd seo={seo} />
			<MockTestOnlineSelectExamForm
				pendingLeadId={pendingLeadId}
				campaigns={campaigns}
				selectedCampaign={selectedCampaign}
				campaignsError={campaignsError}
				attemptStatus={attemptStatus}
			/>
		</>
	);
}
