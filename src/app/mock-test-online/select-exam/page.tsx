import { redirect } from 'next/navigation';
import { MockTestOnlineSelectExamForm } from '@/components/public-mock-test-online/MockTestOnlineSelectExamForm';
import { MockTestOnlineSeoJsonLd } from '@/components/public-mock-test-online/MockTestOnlineSeoJsonLd';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';
import { loadMockTestOnlineSelectExamPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { fetchMockTestOnlineSeo } from '@/lib/public-mock-test-online/seo/fetch-seo.server';
import { buildPageMetadata } from '@/lib/metadata';
import { getCachedPortalSession } from '@/lib/portal-auth/resolve-portal-session.server';
import { resolveSelectExamAttemptStatus } from '@/lib/public-mock-test-online/resolve-select-exam-attempt-status.server';
import { buildMockTestOnlineConfirmExamPath } from '@/lib/public-mock-test-online/select-exam-cache';
import {
	buildPortalLoginHref,
	PORTAL_RETURN_URL_QUERY,
} from '@/lib/portal-auth/post-auth-return-url';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { fetchPortalMockTestExamHome } from '@/features/portal-mock-test/server/fetch-my-exam-home.server';
import { LEAD_COMPLETE_PROFILE_PATH } from '@/lib/portal-auth/session-routes';
import {
	buildSelectExamIntentPath,
	parseSelectExamIntentFromSearchParams,
} from '@/lib/public-mock-test-online/mto-exam-intent';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
	title: 'Chọn bài thi thử online',
	description:
		'Chọn bài thi thử phù hợp mục đích đánh giá năng lực tiếng Anh của bạn.',
	path: '/mock-test-online/select-exam',
});

type PageProps = {
	searchParams: Promise<{
		campaign?: string;
		sessionId?: string;
		variant?: string;
	}>;
};

/**
 * Prefill + 1 click (browse-first B). Guest → login với returnUrl giữ intent.
 * Auth gates (pending / resume / profile) giữ như auth-first.
 */
export default async function MockTestOnlineSelectExamPage({
	searchParams,
}: PageProps) {
	const sp = await searchParams;
	const intentFromUrl = parseSelectExamIntentFromSearchParams(sp);
	const selectReturnPath = intentFromUrl
		? buildSelectExamIntentPath(intentFromUrl)
		: PORTAL_MOCK_TEST_ROUTES.onlineSelect;

	const session = await getCachedPortalSession();
	if (session.actor === 'guest') {
		redirect(
			buildPortalLoginHref({
				mode: 'lead',
				returnUrl: selectReturnPath,
			}),
		);
	}

	const examHome = await fetchPortalMockTestExamHome();
	if (examHome?.gates?.requireCompleteProfileBeforeSelect) {
		if (session.actor === 'customer') {
			redirect(`${PORTAL_MOCK_TEST_ROUTES.hub}?notice=profile_required`);
		}
		const q = new URLSearchParams({
			[PORTAL_RETURN_URL_QUERY]: selectReturnPath,
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
		const regId = examHome.activeAttempt.registrationId;
		redirect(
			regId != null && regId >= 1
				? `${PORTAL_MOCK_TEST_ROUTES.onlineExamRun}?registrationId=${regId}`
				: PORTAL_MOCK_TEST_ROUTES.onlineExamRun,
		);
	}
	if (examHome?.activeReady?.resumeAllowed) {
		const regId = examHome.activeReady.registrationId;
		if (regId != null && regId >= 1) {
			redirect(`/mock-test-online/exam/ready?registrationId=${regId}`);
		}
	}

	const campaignId = intentFromUrl?.sessionId;
	const { campaigns, typePresentations, selectedCampaign, campaignsError } =
		await loadMockTestOnlineSelectExamPageData(undefined, campaignId);
	const seo = await fetchMockTestOnlineSeo();

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
				typePresentations={typePresentations}
				selectedCampaign={selectedCampaign}
				campaignsError={campaignsError}
				attemptStatus={attemptStatus}
				pendingLeadId=""
				initialVariant={intentFromUrl?.testVariantChoice}
			/>
		</MockTestClientErrorBoundary>
	);
}
