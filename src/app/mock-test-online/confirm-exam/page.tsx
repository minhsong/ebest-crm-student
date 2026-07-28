import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { MockTestOnlineConfirmExamClient } from '@/components/public-mock-test-online/MockTestOnlineConfirmExamClient';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';
import { loadMockTestOnlineSelectExamPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { getCachedPortalSession } from '@/lib/portal-auth/resolve-portal-session.server';
import { buildPortalLoginHref } from '@/lib/portal-auth/post-auth-return-url';
import { PORTAL_MOCK_TEST_ROUTES } from '@/features/portal-mock-test/routes.config';
import { fetchPortalMockTestExamHome } from '@/features/portal-mock-test/server/fetch-my-exam-home.server';
import { buildPageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
	title: 'Xác minh Zalo — thi thử online',
	description: 'Xác minh qua Zalo OA Ebest để hoàn tất bước xác nhận trước khi làm bài.',
	path: '/mock-test-online/confirm-exam',
});

/**
 * Auth-first confirm — ownership qua my-exam-home (Redis account), không Funnel cookie.
 */
export default async function MockTestOnlineConfirmExamPage() {
	const session = await getCachedPortalSession();
	if (session.actor === 'guest') {
		redirect(
			buildPortalLoginHref({
				returnUrl: PORTAL_MOCK_TEST_ROUTES.onlineConfirm,
			}),
		);
	}

	const home = await fetchPortalMockTestExamHome();
	const pendingRegId =
		home?.pendingZalo?.pendingRegistrationId?.trim() ||
		home?.pendingZalo?.pendingId?.trim() ||
		'';
	if (!pendingRegId) {
		redirect(PORTAL_MOCK_TEST_ROUTES.onlineSelect);
	}

	const { campaigns, campaignsError } =
		await loadMockTestOnlineSelectExamPageData(undefined);

	return (
		<Suspense
			fallback={
				<div className="mock-test-online-funnel-root">
					<div className="ebest-mock-test-widget py-16 text-center">Đang tải…</div>
				</div>
			}
		>
			<MockTestClientErrorBoundary variant="funnel">
				<MockTestOnlineConfirmExamClient
					campaigns={campaigns}
					campaignsError={campaignsError}
				/>
			</MockTestClientErrorBoundary>
		</Suspense>
	);
}
