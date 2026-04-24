import { NextRequest, NextResponse } from 'next/server';
import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

export async function POST(request: NextRequest) {
  const token = getStudentAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const body = await request.json();
  return proxyStudentPostJson({
    body,
    path: STUDENT_API.authChangePassword,
    headers: { Authorization: `Bearer ${token}` },
    errorFallback: 'Không thể đổi mật khẩu.',
  });
}
