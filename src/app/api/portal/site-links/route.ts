import { handlePortalBffGet } from '@/lib/portal-bff-get-route';
import { fetchPortalSiteLinksFromCrm } from '@/lib/portal-course-catalog/fetch-portal-course-catalog';

export async function GET(request: Request) {
  return handlePortalBffGet({
    request,
    rateLimitBucket: 'portal:site-links',
    errorMessage: 'Không tải được liên kết portal.',
    fetch: fetchPortalSiteLinksFromCrm,
  });
}
