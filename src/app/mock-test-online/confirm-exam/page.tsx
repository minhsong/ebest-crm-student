import { Suspense } from 'react';
import { MockTestOnlineConfirmExamClient } from '@/components/public-mock-test-online/MockTestOnlineConfirmExamClient';
import { loadMockTestOnlineSelectExamPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { getMockTestOnlineFunnelSessionId } from '@/lib/public-mock-test-online/mock-test-online-lead-cookie';
import { fetchGatewayFunnelSession } from '@/lib/public-mock-test-online/ssr/fetch-mock-test-online-gateway.server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { assertFunnelMatchesPortalActor } from '@/features/portal-mock-test/server/assert-funnel-identity.server';
import { buildPageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
	title: 'Xác nhận bài thi thử online',
	description: 'Xác nhận bài thi, Zalo OA và mã mở khóa — Ebest English.',
	path: '/mock-test-online/confirm-exam',
});

type PageProps = {
	searchParams: Promise<{ lead?: string }>;
};

export default async function MockTestOnlineConfirmExamPage({
	searchParams,
}: PageProps) {
	const sp = await searchParams;
	const pendingLeadId =
		sp.lead?.trim() || getMockTestOnlineFunnelSessionId() || '';

	const session = await resolvePortalSessionFromCookies();
	if (pendingLeadId) {
		const funnel = await fetchGatewayFunnelSession(pendingLeadId);
		assertFunnelMatchesPortalActor(session, funnel, pendingLeadId);
	}

	const { campaigns, campaignsError } = await loadMockTestOnlineSelectExamPageData(
		pendingLeadId || undefined,
	);

	return (
		<Suspense
			fallback={
				<div className="mock-test-online-funnel-root">
					<div className="ebest-mock-test-widget py-16 text-center">Đang tải…</div>
				</div>
			}
		>
			<MockTestOnlineConfirmExamClient
				campaigns={campaigns}
				campaignsError={campaignsError}
			/>
		</Suspense>
	);
}
