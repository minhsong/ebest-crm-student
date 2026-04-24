import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';
import { NextResponse } from 'next/server';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  const body = await request.json();
  const token = getStudentAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  return proxyStudentPostJson({
    body,
    path: STUDENT_API.authGoogleLink,
    errorFallback: 'Liên kết Google thất bại.',
    headers: { Authorization: `Bearer ${token}` },
  });
}
