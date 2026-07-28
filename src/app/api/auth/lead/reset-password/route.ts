import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';

/**
 * @deprecated Alias — dùng `POST /api/auth/reset-password` (CRM auth/reset-password thống nhất).
 */
export async function POST(request: Request) {
  const body = await request.json();
  return proxyStudentPostJson({
    body,
    path: STUDENT_API.authResetPassword,
    errorFallback: 'Không thể đặt lại mật khẩu.',
  });
}
