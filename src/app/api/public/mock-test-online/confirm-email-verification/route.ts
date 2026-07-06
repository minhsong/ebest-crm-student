import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { setLeadAccessTokenCookie } from '@/lib/lead-auth-cookie';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';

type ConfirmEmailPayload = {
  email?: string;
  leadSession?: { accessToken?: string; expiresIn?: string } | null;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const apiBase = getApiBaseUrl()?.replace(/\/$/, '');
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }
  try {
    const res = await fetch(
      `${apiBase}/api/v1/public/mock-test-online/confirm-email-verification`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        mapMockTestBffErrorForClient(data, res.status, 'Xác nhận thất bại.'),
        { status: res.status },
      );
    }
    const payload = (unwrapCrmResponseBody(data) ?? data) as ConfirmEmailPayload;
    if (payload.leadSession?.accessToken) {
      setLeadAccessTokenCookie(payload.leadSession.accessToken);
    }
    return NextResponse.json({
      email: payload.email,
      sessionReady: Boolean(payload.leadSession?.accessToken),
    });
  } catch {
    return NextResponse.json(
      { message: STUDENT_SAFE_USER_MESSAGES.generic },
      { status: 502 },
    );
  }
}
