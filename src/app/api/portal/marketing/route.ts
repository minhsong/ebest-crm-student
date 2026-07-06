import { handlePortalBffGet } from '@/lib/portal-bff-get-route';
import { fetchPortalMarketingFromCrm } from '@/lib/portal-marketing/fetch-portal-marketing';

/** @deprecated Dùng `/api/portal/explore` — route giữ compat, data từ Postgres. */
export async function GET(request: Request) {
  return handlePortalBffGet({
    request,
    rateLimitBucket: 'portal:marketing',
    errorMessage: 'Không tải được nội dung marketing.',
    fetch: fetchPortalMarketingFromCrm,
  });
}
