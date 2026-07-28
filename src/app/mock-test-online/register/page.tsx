import { redirect } from 'next/navigation';
import { getCachedPortalSession } from '@/lib/portal-auth/resolve-portal-session.server';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { fetchPortalMockTestExamHome } from '@/features/portal-mock-test/server/fetch-my-exam-home.server';
import { buildMockTestOnlineConfirmExamPath } from '@/lib/public-mock-test-online/select-exam-cache';

export const dynamic = 'force-dynamic';

/**
 * Legacy `/mock-test-online/register` — browse-first: guest → list public; auth → select/confirm/resume.
 */
export default async function MockTestOnlineRegisterPage() {
	const session = await getCachedPortalSession();
	if (session.actor === 'guest') {
		redirect('/mock-test-online');
	}

	const home = await fetchPortalMockTestExamHome();
	const pendingRegId =
		home?.pendingZalo?.pendingRegistrationId?.trim() ||
		home?.pendingZalo?.pendingId?.trim() ||
		'';
	if (pendingRegId) {
		redirect(
			buildMockTestOnlineConfirmExamPath({
				pendingRegistrationId: pendingRegId,
				sessionId:
					typeof home?.pendingZalo?.sessionId === 'number'
						? home.pendingZalo.sessionId
						: undefined,
			}),
		);
	}
	if (home?.activeAttempt?.resumeAllowed) {
		redirect(PORTAL_MOCK_TEST_ROUTES.onlineExamRun);
	}

	redirect(PORTAL_MOCK_TEST_ROUTES.onlineSelect);
}
