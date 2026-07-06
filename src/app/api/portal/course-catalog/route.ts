import { handlePortalBffGet } from '@/lib/portal-bff-get-route';
import { fetchPortalCourseCatalogFromCrm } from '@/lib/portal-course-catalog/fetch-portal-course-catalog';

export async function GET(request: Request) {
  return handlePortalBffGet({
    request,
    rateLimitBucket: 'portal:course-catalog',
    errorMessage: 'Không tải được danh mục khóa học.',
    fetch: fetchPortalCourseCatalogFromCrm,
  });
}
