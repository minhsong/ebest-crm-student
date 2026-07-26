import { MockTestOnlineBrowseCampaignsClient } from '@/components/public-mock-test-online/MockTestOnlineBrowseCampaignsClient';
import { MockTestOnlineSeoJsonLd } from '@/components/public-mock-test-online/MockTestOnlineSeoJsonLd';
import { MockTestClientErrorBoundary } from '@/components/public-mock-test-online/MockTestClientErrorBoundary';
import { loadMockTestOnlineSelectExamPageData } from '@/lib/public-mock-test-online/fetch-online.server';
import { fetchMockTestOnlineSeo } from '@/lib/public-mock-test-online/seo/fetch-seo.server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { buildPageMetadata } from '@/lib/metadata';

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Thi thử online',
  description: 'Chọn bài thi thử online Ebest — thi thử miễn phí, dễ bắt đầu.',
  path: '/mock-test-online',
});

/**
 * Browse marketing: list theo loại đề → chọn → Bước tiếp theo (auth/select theo session).
 */
export default async function MockTestOnlinePage() {
  const [seo, session, pageData] = await Promise.all([
    fetchMockTestOnlineSeo(),
    resolvePortalSessionFromCookies(),
    loadMockTestOnlineSelectExamPageData(undefined),
  ]);

  const actor =
    session.actor === 'lead' || session.actor === 'customer'
      ? session.actor
      : 'guest';

  return (
    <MockTestClientErrorBoundary>
      <MockTestOnlineSeoJsonLd seo={seo} />
      <MockTestOnlineBrowseCampaignsClient
        campaigns={pageData.campaigns}
        campaignsError={pageData.campaignsError}
        actor={actor}
      />
    </MockTestClientErrorBoundary>
  );
}
