import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

const STUDENT_BASE = '/api/v1/student';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string; materialId: string } },
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
  const sessionId = Number.parseInt(params.sessionId, 10);
  const materialId = Number.parseInt(params.materialId, 10);
  if (!Number.isFinite(sessionId) || sessionId < 1 || !Number.isFinite(materialId) || materialId < 1) {
    return NextResponse.json({ message: 'Tham số không hợp lệ.' }, { status: 400 });
  }
  let body: Record<string, unknown> = {};
  try {
    const text = await request.text();
    if (text?.trim()) {
      body = JSON.parse(text) as Record<string, unknown>;
    }
  } catch {
    body = {};
  }
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/class-sessions/${sessionId}/materials/${materialId}/access`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      typeof data?.message === 'string' ? { message: data.message } : data,
      { status: res.status },
    );
  }
  /** CRM bọc { signedUrl, expiresIn } trong `result` — trả phẳng cho client (react-player / modal). */
  const payload = data?.result ?? data;
  return NextResponse.json(payload);
}
