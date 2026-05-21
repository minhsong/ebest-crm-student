import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

const STUDENT_BASE = '/api/v1/student';

export async function DELETE(
  _request: Request,
  {
    params,
  }: { params: { id: string; attachmentId: string } },
) {
  const token = getStudentAccessTokenFromCookie();
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

  const assignmentId = Number.parseInt(params.id, 10);
  const attachmentId = (params.attachmentId ?? '').trim();
  if (!Number.isFinite(assignmentId) || assignmentId < 1) {
    return NextResponse.json(
      { message: 'Mã bài tập không hợp lệ.' },
      { status: 400 },
    );
  }
  if (!attachmentId) {
    return NextResponse.json(
      { message: 'Mã file không hợp lệ.' },
      { status: 400 },
    );
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/assignments/${assignmentId}/submission/attachments/${encodeURIComponent(attachmentId)}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.message ? { message: data.message } : data,
      { status: res.status },
    );
  }
  const payload = data?.result ?? data?.data ?? data;
  return NextResponse.json(payload ?? {});
}
