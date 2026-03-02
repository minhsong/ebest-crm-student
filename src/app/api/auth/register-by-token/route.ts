import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';

const STUDENT_BASE = '/api/v1/student';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { message: 'Cấu hình server chưa đúng.' },
        { status: 500 }
      );
    }
    const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/auth/register-by-token`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { message: data?.message ?? 'Tạo tài khoản thất bại.' },
        { status: res.status }
      );
    }
    const payload = data?.result ?? data?.data ?? data;
    return NextResponse.json(payload ?? data);
  } catch {
    return NextResponse.json(
      { message: 'Không thể kết nối. Vui lòng thử lại.' },
      { status: 502 }
    );
  }
}
