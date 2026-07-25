import { NextRequest, NextResponse } from 'next/server';
import { STUDENT_SAFE_USER_MESSAGES, logInternalApiError } from '@/lib/student-safe-errors';
import {
  briefErrorDetail,
  isMockTestBffErrorDetailsEnabled,
} from '@/lib/public-mock-test-online/mock-test-error-details';
import { fetchPublicMockTestCrmJson } from '@/lib/public-mock-test-online/proxy-public-mock-test-crm.server';

/** P3-4 — gợi ý exam done: ẩn CTA đăng ký lead khi contact thuộc HV. */
export async function GET(request: NextRequest) {
  const registrationId = Number(
    request.nextUrl.searchParams.get('registrationId'),
  );
  if (!Number.isFinite(registrationId) || registrationId < 1) {
    return NextResponse.json({ hideLeadRegister: false });
  }

  try {
    const result = await fetchPublicMockTestCrmJson<{
      hideLeadRegister?: boolean;
    }>({
      path: `registrations/${registrationId}/funnel-hint`,
      logContext: 'mto.bff.funnel-hint',
    });
    if (!result.ok || !result.data) {
      return NextResponse.json({ hideLeadRegister: false });
    }
    return NextResponse.json({
      hideLeadRegister: result.data.hideLeadRegister === true,
    });
  } catch (error) {
    logInternalApiError('mto.bff.funnel-hint', error, {
      path: '/api/public/mock-test-online/funnel-hint',
      method: 'GET',
      errorType: 'BFF_FUNNEL_HINT_ERROR',
    });
    const body: Record<string, unknown> = {
      hideLeadRegister: false,
      message: STUDENT_SAFE_USER_MESSAGES.generic,
    };
    if (isMockTestBffErrorDetailsEnabled()) {
      body.detail = briefErrorDetail(error);
      body.errorCode = 'BFF_FUNNEL_HINT_ERROR';
    }
    return NextResponse.json(body, { status: 502 });
  }
}
