import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { patchProfileUrl } from '@/lib/student-api';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';

function parseJsonSafe(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * POST /api/profile: forward PATCH tới CRM Student Portal API.
 * CRM: PATCH /api/v1/student/profile (domain /api/v1/student/*).
 * Body: { token, ...fields }. Không lộ CRM_API_URL ra client.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token;
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { message: 'Thiếu token.' },
        { status: 422 },
      );
    }

    const apiBaseUrl = getApiBaseUrl();
    if (!apiBaseUrl) {
      return NextResponse.json(
        { message: 'Cấu hình server chưa đúng.' },
        { status: 500 },
      );
    }
    const url = patchProfileUrl(apiBaseUrl);
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    const json = parseJsonSafe(text);

    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(json, res.status, 'Cập nhật thất bại.'),
        { status: res.status },
      );
    }
    return NextResponse.json(json ?? { success: true, data: null });
  } catch {
    return NextResponse.json(
      { message: 'Không thể kết nối. Vui lòng thử lại.' },
      { status: 502 },
    );
  }
}
