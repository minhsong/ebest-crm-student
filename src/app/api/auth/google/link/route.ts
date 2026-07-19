import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';
import { NextResponse } from 'next/server';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = getStudentAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  return proxyStudentPostJson({
    body: {
      idToken: typeof body?.idToken === 'string' ? body.idToken : '',
    },
    path: STUDENT_API.authGoogleLink,
    errorFallback: 'Liên kết Google thất bại.',
    headers: { Authorization: `Bearer ${token}` },
    transform: (raw) => {
      const payload = (raw ?? {}) as Record<string, unknown>;
      return {
        message:
          typeof payload.message === 'string'
            ? payload.message
            : 'Đã liên kết Google.',
      };
    },
  });
}
