import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';
import { getLeadAccessTokenFromCookie } from '@/lib/lead-auth-cookie';
import { proxyPortalAuthenticatedGetJson } from '@/lib/crm-student-proxy';
import { handlePortalBffGet } from '@/lib/portal-bff-get-route';
import { fetchPortalExploreFromCrm } from '@/lib/portal-course-catalog/fetch-portal-explore';
import { STUDENT_API } from '@/lib/student-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') ?? 'vi-VN';
  const studentToken = getStudentAccessTokenFromCookie()?.trim();
  const leadToken = getLeadAccessTokenFromCookie()?.trim();

  if (studentToken || leadToken) {
    return proxyPortalAuthenticatedGetJson({
      path: STUDENT_API.portalExplore,
      query: { locale, include: 'recommendations' },
      errorFallback: 'Không tải được nội dung portal.',
    });
  }

  return handlePortalBffGet({
    request,
    rateLimitBucket: 'portal:explore',
    errorMessage: 'Không tải được nội dung portal.',
    fetch: fetchPortalExploreFromCrm,
  });
}
