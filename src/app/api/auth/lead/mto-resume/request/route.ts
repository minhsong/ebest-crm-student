import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';

/** Public — gửi magic link tiếp tục MTO manual (anti-enumerate). */
export async function POST(request: Request) {
  const body = await request.json();
  return proxyStudentPostJson({
    body,
    path: STUDENT_API.authLeadMtoResumeRequest,
    errorFallback: 'Không thể gửi liên kết tiếp tục.',
  });
}
