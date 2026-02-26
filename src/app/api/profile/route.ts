import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';

/**
 * POST /api/profile: forward PATCH profile-by-token to CRM.
 * Body: { token, ...fields }. Không lộ CRM_API_URL ra client.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token;
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'Thiếu token.' },
        { status: 422 }
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { message: 'Cấu hình server chưa đúng.' },
        { status: 500 }
      );
    }
    const url = `${apiBaseUrl.replace(/\/$/, '')}/api/v1/customers/profile-by-token`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { message: (json as { message?: string }).message ?? 'Cập nhật thất bại.' },
        { status: res.status }
      );
    }
    return NextResponse.json(json?.result ?? { success: true });
  } catch (e) {
    return NextResponse.json(
      { message: 'Không thể kết nối. Vui lòng thử lại.' },
      { status: 502 }
    );
  }
}
