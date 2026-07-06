import { Suspense } from 'react';
import { MockTestOnlineEntryClient } from '@/components/public-mock-test-online/MockTestOnlineEntryClient';
import { MockTestOnlineSeoJsonLd } from '@/components/public-mock-test-online/MockTestOnlineSeoJsonLd';
import { fetchMockTestOnlineSeo } from '@/lib/public-mock-test-online/seo/fetch-seo.server';

export const dynamic = 'force-dynamic';

export default async function MockTestOnlinePage() {
	const seo = await fetchMockTestOnlineSeo();

	return (
		<>
			<MockTestOnlineSeoJsonLd seo={seo} />
			<Suspense
				fallback={
					<div className="mock-test-online-funnel-root">
						<div className="ebest-mock-test-widget py-16 text-center">Đang tải…</div>
					</div>
				}
			>
				<MockTestOnlineEntryClient />
			</Suspense>
		</>
	);
}
