import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

const STUDENT_BASE = '/api/v1/student';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
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
  const id = params.id;
  const assignmentId = Number.parseInt(id, 10);
  if (!Number.isFinite(assignmentId) || assignmentId < 1) {
    return NextResponse.json({ message: 'Mã bài tập không hợp lệ.' }, { status: 400 });
  }
  let body: { attemptPublicId?: string } = {};
  try {
    body = (await request.json()) as { attemptPublicId?: string };
  } catch {
    return NextResponse.json({ message: 'Body không hợp lệ.' }, { status: 400 });
  }
  if (!body.attemptPublicId || typeof body.attemptPublicId !== 'string') {
    return NextResponse.json(
      { message: 'Thiếu attemptPublicId (UUID).' },
      { status: 400 },
    );
  }
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/assignments/${assignmentId}/quiz-result/sync`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attemptPublicId: body.attemptPublicId }),
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
