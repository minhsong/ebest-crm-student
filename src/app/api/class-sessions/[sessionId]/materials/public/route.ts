import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';

const STUDENT_BASE = '/api/v1/student';

function getAuthHeader(request: NextRequest): string | null {
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth;
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } },
) {
  const auth = getAuthHeader(request);
  if (!auth) {
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
  if (!Number.isFinite(sessionId) || sessionId < 1) {
    return NextResponse.json({ message: 'Mã buổi học không hợp lệ.' }, { status: 400 });
  }
  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/class-sessions/${sessionId}/materials/public`;
  const res = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: auth },
  });
  const data = await res.json().catch(() => ([]));
  if (!res.ok) {
    return NextResponse.json(
      typeof data?.message === 'string' ? { message: data.message } : data,
      { status: res.status },
    );
  }
  if (Array.isArray(data)) {
    return NextResponse.json(data);
  }
  const payload = data?.result ?? data?.data ?? data;
  return NextResponse.json(Array.isArray(payload) ? payload : []);
}
