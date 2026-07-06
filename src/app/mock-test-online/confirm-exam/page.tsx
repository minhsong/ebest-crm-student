import { Suspense } from 'react';
import { MockTestOnlineConfirmExamClient } from '@/components/public-mock-test-online/MockTestOnlineConfirmExamClient';
import { loadMockTestOnlineSelectExamPageData } from '@/lib/public-mock-test-online/fetch-online.server';
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
	const pendingLeadId = sp.lead?.trim() ?? '';

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
