import { NextRequest, NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromRequest } from '@/lib/crm-student-me';

const STUDENT_BASE = '/api/v1/student';

export async function GET(request: NextRequest) {
  const token = getStudentAccessTokenFromRequest(request);
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/learning/practice-quizzes`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.message ? { message: data.message } : data,
      { status: res.status },
    );
  }
  return NextResponse.json(data?.result ?? data?.data ?? data);
}
