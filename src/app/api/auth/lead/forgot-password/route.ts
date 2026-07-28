import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';

/**
 * @deprecated Alias — dùng `POST /api/auth/forgot-password` (CRM auth/forgot-password thống nhất).
 */
export async function POST(request: Request) {
  const body = await request.json();
  const loginId =
    typeof body?.loginId === 'string'
      ? body.loginId
      : typeof body?.email === 'string'
        ? body.email
        : undefined;
  return proxyStudentPostJson({
    body: { loginId, email: body?.email },
    path: STUDENT_API.authForgotPassword,
    errorFallback: 'Không thể gửi yêu cầu.',
  });
}
