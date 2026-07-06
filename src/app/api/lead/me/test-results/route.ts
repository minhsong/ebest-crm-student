import { STUDENT_API } from '@/lib/student-api';
import { proxyLeadAuthenticatedGetJson } from '@/lib/crm-student-proxy';
import { getLeadAccessTokenFromCookie } from '@/lib/lead-auth-cookie';

export async function GET() {
  return proxyLeadAuthenticatedGetJson({
    path: STUDENT_API.leadTestResults,
    token: getLeadAccessTokenFromCookie(),
  });
}
