import { proxyStudentPostJson } from '@/lib/crm-student-proxy';
import { STUDENT_API } from '@/lib/student-api';

/** Public — gửi lại email xác nhận lead. */
export async function POST(request: Request) {
  const body = await request.json();
  return proxyStudentPostJson({
    path: STUDENT_API.authLeadResendVerification,
    body,
    errorFallback: 'Không gửi lại được email xác nhận.',
  });
}
