import { STUDENT_API } from '@/lib/student-api';
import { proxyPortalAuthenticatedGetJson } from '@/lib/crm-student-proxy';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get('locale') ?? 'vi-VN';

  return proxyPortalAuthenticatedGetJson({
    path: STUDENT_API.portalRecommendations,
    query: { locale },
    errorFallback: 'Không tải được gợi ý khóa học.',
  });
}
