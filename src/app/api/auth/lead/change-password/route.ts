import { STUDENT_API } from '@/lib/student-api';
import { proxyLeadAuthenticatedPostJson } from '@/lib/crm-student-proxy';
import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyLeadAuthenticatedPostJson({
    body,
    path: STUDENT_API.authLeadChangePassword,
    token: getPortalAccessTokenFromCookie(),
    errorFallback: 'Đổi mật khẩu thất bại.',
  });
}
