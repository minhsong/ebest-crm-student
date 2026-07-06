import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';

/** Không prerender — proxy runtime tới CRM (tránh fetch fail lúc `next build`). */
export const dynamic = 'force-dynamic';

/** BFF proxy SEO config — cache CDN/browser 5 phút. */
export async function GET() {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }
  const url = `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test-online/seo`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    const payload = unwrapCrmResponseBody(data) ?? data;
    return NextResponse.json(payload, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không thể tải cấu hình SEO. Vui lòng thử lại sau.' },
      { status: 502 },
    );
  }
}
