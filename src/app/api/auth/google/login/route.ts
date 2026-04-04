import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyStudentPostJson({
    body,
    path: STUDENT_API.authGoogleLogin,
    errorFallback: 'Đăng nhập Google thất bại.',
  });
}
