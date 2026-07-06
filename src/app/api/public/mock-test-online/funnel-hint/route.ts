import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';

/** P3-4 — gợi ý exam done: ẩn CTA đăng ký lead khi contact thuộc HV. */
export async function GET(request: NextRequest) {
  const registrationId = Number(
    request.nextUrl.searchParams.get('registrationId'),
  );
  if (!Number.isFinite(registrationId) || registrationId < 1) {
    return NextResponse.json({ hideLeadRegister: false });
  }

  const apiBase = getApiBaseUrl()?.replace(/\/$/, '');
  if (!apiBase) {
    return NextResponse.json({ hideLeadRegister: false });
  }

  try {
    const res = await fetch(
      `${apiBase}/api/v1/public/mock-test-online/registrations/${registrationId}/funnel-hint`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' },
    );
    const data = (await res.json().catch(() => ({}))) as {
      hideLeadRegister?: boolean;
      data?: { hideLeadRegister?: boolean };
    };
    const payload = (data as { data?: { hideLeadRegister?: boolean } }).data ?? data;
    return NextResponse.json({
      hideLeadRegister: payload?.hideLeadRegister === true,
    });
  } catch {
    return NextResponse.json(
      { hideLeadRegister: false, message: STUDENT_SAFE_USER_MESSAGES.generic },
      { status: 502 },
    );
  }
}
