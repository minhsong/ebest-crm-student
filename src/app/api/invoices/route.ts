import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

const STUDENT_BASE = '/api/v1/student';

export async function GET(request: NextRequest) {
  const token = getStudentAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 }
    );
  }
  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  const q = [page && `page=${page}`, limit && `limit=${limit}`].filter(Boolean).join('&');
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/invoices${q ? `?${q}` : ''}`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.message ? { message: data.message } : data,
      { status: res.status }
    );
  }
  const payload = data?.result ?? data?.data ?? data;
  return NextResponse.json(payload ?? { data: [], pagination: {} });
}
