import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';

/**
 * GET /api/vietnam-administrative/provinces
 * Proxy to CRM API: GET /api/v1/vietnam-administrative/provinces
 */
export async function GET() {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 }
    );
  }
  const base = apiBaseUrl.replace(/\/$/, '');
  const url = `${base}/api/v1/vietnam-administrative/provinces`;
  try {
    const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(data ?? { message: 'Lỗi tải danh sách tỉnh/thành.' }, { status: res.status });
    }
    // CRM API wraps in { success, result: ProvinceDto[] }
    const list = Array.isArray(data) ? data : data?.result ?? data?.data ?? [];
    return NextResponse.json(Array.isArray(list) ? list : []);
  } catch (e) {
    return NextResponse.json(
      { message: 'Không thể kết nối tải dữ liệu địa chỉ.' },
      { status: 502 }
    );
  }
}
