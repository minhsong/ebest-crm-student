import { handlePortalBffGet } from '@/lib/portal-bff-get-route';
import { fetchPortalExploreFromCrm } from '@/lib/portal-course-catalog/fetch-portal-explore';

export async function GET(request: Request) {
  return handlePortalBffGet({
    request,
    rateLimitBucket: 'portal:explore',
    errorMessage: 'Không tải được nội dung portal.',
    fetch: fetchPortalExploreFromCrm,
  });
}
