import { NextResponse } from 'next/server';
import { setLeadPortalSessionCookieIfSafe } from '@/lib/portal-auth/portal-auth-session.server';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { mockTestBffCatchResponse } from '@/lib/public-mock-test-online/mock-test-bff-catch-response';
import { fetchPublicMockTestCrmJson } from '@/lib/public-mock-test-online/proxy-public-mock-test-crm.server';

type ConfirmEmailPayload = {
  email?: string;
  leadSession?: { accessToken?: string; expiresIn?: string } | null;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  try {
    const result = await fetchPublicMockTestCrmJson<ConfirmEmailPayload>({
      path: 'confirm-email-verification',
      method: 'POST',
      body,
      logContext: 'mto.bff.confirm-email',
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
          'Xác nhận thất bại.',
        ),
        { status: result.status },
      );
    }
    const payload = (result.data ?? {}) as ConfirmEmailPayload;
    let sessionReady = false;
    if (payload.leadSession?.accessToken) {
      const applied = await setLeadPortalSessionCookieIfSafe(
        payload.leadSession.accessToken,
      );
      sessionReady = applied === 'set' || applied === 'skipped_customer';
    }
    return NextResponse.json({
      email: payload.email,
      sessionReady,
    });
  } catch (error) {
    return mockTestBffCatchResponse(error, {
      errorCode: 'BFF_CONFIRM_EMAIL_ERROR',
      logContext: 'mto.bff.confirm-email',
      path: '/api/public/mock-test-online/confirm-email-verification',
      method: 'POST',
    });
  }
}
