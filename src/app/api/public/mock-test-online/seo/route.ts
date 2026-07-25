import { NextResponse } from 'next/server';
import { mockTestBffCatchResponse } from '@/lib/public-mock-test-online/mock-test-bff-catch-response';
import { fetchPublicMockTestCrmJson } from '@/lib/public-mock-test-online/proxy-public-mock-test-crm.server';

/** Không prerender — proxy runtime tới CRM (tránh fetch fail lúc `next build`). */
export const dynamic = 'force-dynamic';

/** BFF proxy SEO config — cache CDN/browser 5 phút. */
export async function GET() {
  try {
    const result = await fetchPublicMockTestCrmJson({
      path: 'seo',
      logContext: 'mto.bff.seo',
    });
    if (result.configMissing) {
      return NextResponse.json(
        { message: 'Cấu hình server chưa đúng.' },
        { status: 500 },
      );
    }
    if (!result.ok) {
      return NextResponse.json(result.raw, { status: result.status });
    }
    return NextResponse.json(result.data ?? result.raw, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return mockTestBffCatchResponse(error, {
      errorCode: 'BFF_SEO_ERROR',
      message: 'Không thể tải cấu hình SEO. Vui lòng thử lại sau.',
      logContext: 'mto.bff.seo',
      path: '/api/public/mock-test-online/seo',
      method: 'GET',
    });
  }
}
