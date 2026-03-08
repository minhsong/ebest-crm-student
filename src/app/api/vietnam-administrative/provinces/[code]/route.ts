import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';

/**
 * GET /api/vietnam-administrative/provinces/[code]
 * Proxy to CRM API: GET /api/v1/vietnam-administrative/provinces/:code/full
 * Returns province with wards array (2-level: Province -> Ward).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  if (!code) {
    return NextResponse.json({ message: 'Thiếu mã tỉnh/thành.' }, { status: 400 });
  }
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 }
    );
  }
  const base = apiBaseUrl.replace(/\/$/, '');
  const url = `${base}/api/v1/vietnam-administrative/provinces/${encodeURIComponent(code)}/full`;
  try {
    const res = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(data ?? { message: 'Không tìm thấy tỉnh/thành.' }, { status: res.status });
    }
    // CRM API wraps in { success, result: { name, code, codename, wards } }
    const payload = data?.result ?? data?.data ?? data;
    return NextResponse.json(payload ?? { wards: [] });
  } catch (e) {
    return NextResponse.json(
      { message: 'Không thể kết nối tải dữ liệu địa chỉ.' },
      { status: 502 }
    );
  }
}
