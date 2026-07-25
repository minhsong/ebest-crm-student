import { redirect } from 'next/navigation';
import { MockTestOnlineSelectExamForm } from '@/components/public-mock-test-online/MockTestOnlineSelectExamForm';
import { MockTestOnlineSeoJsonLd } from '@/components/public-mock-test-online/MockTestOnlineSeoJsonLd';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';
import { loadMockTestOnlineSelectExamPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { fetchMockTestOnlineSeo } from '@/lib/public-mock-test-online/seo/fetch-seo.server';
import { buildPageMetadata } from '@/lib/metadata';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { resolveSelectExamAttemptStatus } from '@/lib/public-mock-test-online/resolve-select-exam-attempt-status.server';
import { buildMockTestOnlineConfirmExamPath } from '@/lib/public-mock-test-online/select-exam-cache';
import {
	buildPortalLoginHref,
	PORTAL_RETURN_URL_QUERY,
} from '@/lib/portal-auth/post-auth-return-url';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { fetchPortalMockTestExamHome } from '@/features/portal-mock-test/server/fetch-my-exam-home.server';
import { LEAD_COMPLETE_PROFILE_PATH } from '@/lib/portal-auth/session-routes';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
	title: 'Chọn bài thi thử online',
	description: 'Chọn bài thi sau khi đăng ký thi thử online Ebest.',
	path: '/mock-test-online/select-exam',
});

type PageProps = {
	searchParams: Promise<{ campaign?: string }>;
};

/**
 * Auth-first (PO-D17/D24/D30): bắt buộc portal_at trước list/select.
 * Pending Zalo / in_exam / profile gate từ CRM my-exam-home.
 */
export default async function MockTestOnlineSelectExamPage({
	searchParams,
}: PageProps) {
	const session = await resolvePortalSessionFromCookies();
	if (session.actor === 'guest') {
		redirect(
			buildPortalLoginHref({
				returnUrl: PORTAL_MOCK_TEST_ROUTES.onlineSelect,
			}),
		);
	}

	const examHome = await fetchPortalMockTestExamHome();
	if (examHome?.gates?.requireCompleteProfileBeforeSelect) {
		if (session.actor === 'customer') {
			redirect(`${PORTAL_MOCK_TEST_ROUTES.hub}?notice=profile_required`);
		}
		const q = new URLSearchParams({
			[PORTAL_RETURN_URL_QUERY]: PORTAL_MOCK_TEST_ROUTES.onlineSelect,
		});
		redirect(`${LEAD_COMPLETE_PROFILE_PATH}?${q.toString()}`);
	}
	const pendingRegId =
		examHome?.pendingZalo?.pendingRegistrationId?.trim() ||
		examHome?.pendingZalo?.pendingId?.trim() ||
		'';
	if (pendingRegId) {
		redirect(
			buildMockTestOnlineConfirmExamPath({
				pendingRegistrationId: pendingRegId,
				sessionId:
					typeof examHome?.pendingZalo?.sessionId === 'number'
						? examHome.pendingZalo.sessionId
						: undefined,
			}),
		);
	}
	if (examHome?.activeAttempt?.resumeAllowed) {
		redirect(PORTAL_MOCK_TEST_ROUTES.onlineExamRun);
	}

	const sp = await searchParams;
	const campaignRaw = sp.campaign?.trim();
	const campaignId = campaignRaw ? parseInt(campaignRaw, 10) : undefined;

	const { campaigns, selectedCampaign, campaignsError } =
		await loadMockTestOnlineSelectExamPageData(
			undefined,
			Number.isFinite(campaignId) ? campaignId : undefined,
		);
	const seo = await fetchMockTestOnlineSeo();

	// Ưu tiên attemptStatus từ my-exam-home — tránh fetch CRM/GW lần 2.
	const attemptStatus =
		examHome?.attemptStatus ??
		(session.actor === 'lead' || session.actor === 'customer'
			? await resolveSelectExamAttemptStatus({
					session,
					testTypeCode:
						selectedCampaign?.testTypeCode?.trim() ||
						campaigns[0]?.testTypeCode?.trim() ||
						undefined,
					sessionId: selectedCampaign?.sessionId,
				})
			: null);

	return (
		<MockTestClientErrorBoundary>
			<MockTestOnlineSeoJsonLd seo={seo} />
			<MockTestOnlineSelectExamForm
				campaigns={campaigns}
				selectedCampaign={selectedCampaign}
				campaignsError={campaignsError}
				attemptStatus={attemptStatus}
				pendingLeadId=""
			/>
		</MockTestClientErrorBoundary>
	);
}
