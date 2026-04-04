import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';

export async function POST(request: Request) {
  const body = await request.json();
  const auth = request.headers.get('Authorization');
  return proxyStudentPostJson({
    body,
    path: STUDENT_API.authGoogleLink,
    errorFallback: 'Liên kết Google thất bại.',
    headers: auth ? { Authorization: auth } : {},
  });
}
