import { NextRequest } from 'next/server';
import { STUDENT_API } from '@/lib/student-api';
import {
  proxyLeadAuthenticatedPostJson,
  proxyPortalAuthenticatedPostJson,
} from '@/lib/crm-student-proxy';
import { getLeadAccessTokenFromCookie } from '@/lib/lead-auth-cookie';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

const ERROR_FALLBACK = 'Đăng ký thi thử thất bại. Vui lòng thử lại.';

/** Actor-agnostic — student JWT ưu tiên, sau đó lead JWT. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const studentToken = getStudentAccessTokenFromCookie();
  if (studentToken?.trim()) {
    return proxyPortalAuthenticatedPostJson({
      path: STUDENT_API.customerOfflineRegistration,
      body,
      errorFallback: ERROR_FALLBACK,
    });
  }
  return proxyLeadAuthenticatedPostJson({
    path: STUDENT_API.leadOfflineRegistration,
    body,
    token: getLeadAccessTokenFromCookie(),
    errorFallback: ERROR_FALLBACK,
  });
}
