import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';
import { buildCrmStudentUrl, unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { setPortalSessionCookie } from '@/lib/portal-auth/portal-auth-session.server';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';

export async function POST(request: Request) {
  const body = await request.json();
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }

  const url = buildCrmStudentUrl(apiBase, STUDENT_API.authGoogleLogin);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      mapPortalConflictForClient(
        data,
        res.status,
        typeof data?.message === 'string' ? data.message : 'Đăng nhập Google thất bại.',
      ),
      { status: res.status },
    );
  }

  const payload = unwrapCrmResponseBody(data) as Record<string, unknown>;
  if (typeof payload?.completeProfileUrl === 'string') {
    return NextResponse.json(payload);
  }

  const token =
    typeof payload?.accessToken === 'string' ? (payload.accessToken as string).trim() : '';
  if (token) {
    setPortalSessionCookie('customer', token);
  }

  const out = { ...payload };
  delete (out as { accessToken?: unknown }).accessToken;
  return NextResponse.json(out);
}
