import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';
import { STUDENT_API } from '@/lib/student-api';
import { buildCrmStudentUrl, unwrapCrmResponseBody } from '@/lib/crm-student-proxy';

export async function GET() {
  const token = getStudentAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }
  const url = buildCrmStudentUrl(apiBase, STUDENT_API.mockTestResults);
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }
  const payload = unwrapCrmResponseBody(data);
  return NextResponse.json(payload ?? data);
}
