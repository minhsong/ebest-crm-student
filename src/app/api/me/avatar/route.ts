import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { getStudentAccessTokenFromCookie } from '@/lib/auth-cookie';

const STUDENT_BASE = '/api/v1/student';

export async function POST(request: NextRequest) {
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { message: 'Dữ liệu không hợp lệ.' },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { message: 'Vui lòng chọn file ảnh.' },
      { status: 400 }
    );
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}${STUDENT_BASE}/me/avatar`;
  const body = new FormData();
  body.append('file', file, (file as File).name ?? 'avatar');

  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      data?.message ? { message: data.message } : data,
      { status: res.status }
    );
  }
  return NextResponse.json(data?.result ?? data?.data ?? data ?? {});
}
