import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { getPortalAccessTokenFromCookie } from '@/lib/portal-auth-cookie';

const STUDENT_BASE = '/api/v1/student';

/**
 * Mở tài liệu buổi trong tab mới qua `<a href=".../open" target="_blank">`.
 * Cookie portal → lấy signed URL từ CRM → redirect 302 (không cần window.open sau async).
 */
export async function GET(
  _request: Request,
  { params }: { params: { sessionId: string; materialId: string } },
) {
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
  const sessionId = Number.parseInt(params.sessionId, 10);
  const materialId = Number.parseInt(params.materialId, 10);
  if (
    !Number.isFinite(sessionId) ||
    sessionId < 1 ||
    !Number.isFinite(materialId) ||
    materialId < 1
  ) {
    return NextResponse.json({ message: 'Tham số không hợp lệ.' }, { status: 400 });
  }

  const accessUrl = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/class-sessions/${sessionId}/materials/${materialId}/access`;
  const res = await fetch(accessUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      typeof data?.message === 'string' ? { message: data.message } : data,
      { status: res.status },
    );
  }

  const payload = data?.result ?? data;
  const target =
    (typeof payload?.signedUrl === 'string' && payload.signedUrl.trim()) ||
    (typeof payload?.externalUrl === 'string' && payload.externalUrl.trim()) ||
    null;

  if (!target) {
    return NextResponse.json(
      { message: 'Không lấy được đường dẫn tài liệu.' },
      { status: 404 },
    );
  }

  return NextResponse.redirect(target, 302);
}
