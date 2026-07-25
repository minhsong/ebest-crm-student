import { NextRequest, NextResponse } from 'next/server';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { mockTestBffCatchResponse } from '@/lib/public-mock-test-online/mock-test-bff-catch-response';
import { fetchPublicMockTestCrmJson } from '@/lib/public-mock-test-online/proxy-public-mock-test-crm.server';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const result = await fetchPublicMockTestCrmJson({
      path: 'request-email-verification',
      method: 'POST',
      body,
      logContext: 'mto.bff.request-email',
    });
    if (result.configMissing) {
      return NextResponse.json(
        { message: 'Cấu hình server chưa đúng.' },
        { status: 500 },
      );
    }
    if (!result.ok) {
      return NextResponse.json(
        mapMockTestBffErrorForClient(
          result.raw,
          result.status,
          'Không gửi được email xác nhận.',
        ),
        { status: result.status },
      );
    }
    return NextResponse.json(result.data ?? result.raw);
  } catch (error) {
    return mockTestBffCatchResponse(error, {
      errorCode: 'BFF_REQUEST_EMAIL_ERROR',
      logContext: 'mto.bff.request-email',
      path: '/api/public/mock-test-online/request-email-verification',
      method: 'POST',
    });
  }
}
