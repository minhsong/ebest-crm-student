import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';

const STUDENT_BASE = '/api/v1/student';

/** Customer profile read — canonical BFF path (full CRM payload). */
export async function GET() {
  const token = getPortalAccessTokenFromCookie();
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
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/me`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      mapPortalConflictForClient(data, res.status, 'Không tải được hồ sơ.'),
      { status: res.status },
    );
  }
  const payload = unwrapCrmResponseBody(data) ?? data;
  return NextResponse.json(payload);
}

/** Customer profile mutation — canonical BFF path (không overload GET /api/me). */
export async function PATCH(request: Request) {
  const token = getPortalAccessTokenFromCookie();
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
  const body = await request.json();
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/me`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      mapPortalConflictForClient(data, res.status, 'Cập nhật thất bại.'),
      { status: res.status },
    );
  }
  const payload = data?.result ?? data?.data ?? data;
  return NextResponse.json(payload ?? data);
}
