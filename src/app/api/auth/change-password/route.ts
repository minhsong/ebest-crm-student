import { NextRequest, NextResponse } from 'next/server';
import { STUDENT_API } from '@/lib/student-api';
import { proxyStudentPostJson } from '@/lib/crm-student-proxy';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const body = await request.json();
  return proxyStudentPostJson({
    body,
    path: STUDENT_API.authChangePassword,
    headers: { Authorization: auth },
    errorFallback: 'Không thể đổi mật khẩu.',
  });
}
