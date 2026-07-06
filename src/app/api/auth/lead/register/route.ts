import { proxyStudentPostJson } from '@/lib/crm-student-proxy';
import { STUDENT_API } from '@/lib/student-api';

export async function POST(request: Request) {
  const body = await request.json();
  return proxyStudentPostJson({
    path: STUDENT_API.authLeadRegister,
    body,
    errorFallback: 'Không thể đăng ký tài khoản lead.',
  });
}
