import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';
import { buildCrmStudentUrl, unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { setStudentAccessTokenCookie } from '@/lib/auth-cookie';

export async function POST(request: Request) {
  const body = await request.json();
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }

  const url = buildCrmStudentUrl(apiBase, STUDENT_API.authLogin);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      typeof data?.message === 'string' ? { message: data.message } : data,
      { status: res.status },
    );
  }
  const payload = unwrapCrmResponseBody(data) as {
    accessToken?: string;
    customer?: unknown;
  };
  const token = payload?.accessToken?.trim?.() ?? '';
  if (token) {
    setStudentAccessTokenCookie(token);
  }

  // Không trả accessToken về client nữa (SSR + httpOnly cookies)
  return NextResponse.json({ customer: payload?.customer ?? null });
}
