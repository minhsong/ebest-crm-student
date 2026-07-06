import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { setLeadAccessTokenCookie } from '@/lib/lead-auth-cookie';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import {
  mapMockTestBffErrorForClient,
  mapProvisionLeadSessionForClient,
} from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    registrationId?: number;
    pendingRegistrationId?: string;
  };
  const registrationId = Number(body.registrationId);
  const pendingRegistrationId =
    typeof body.pendingRegistrationId === 'string'
      ? body.pendingRegistrationId.trim()
      : '';
  if (
    (!Number.isFinite(registrationId) || registrationId < 1) &&
    !pendingRegistrationId
  ) {
    return NextResponse.json(
      { message: 'Cần registrationId hoặc pendingRegistrationId.' },
      { status: 400 },
    );
  }

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }

  const url = `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test-online/provision-lead-session`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        ...(registrationId >= 1 ? { registrationId } : {}),
        ...(pendingRegistrationId ? { pendingRegistrationId } : {}),
      }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        mapMockTestBffErrorForClient(
          data,
          res.status,
          'Không tạo được phiên đăng nhập. Vui lòng thử lại.',
        ),
        { status: res.status },
      );
    }

    const payload = unwrapCrmResponseBody(data) as { accessToken?: string };
    if (payload?.accessToken) {
      setLeadAccessTokenCookie(payload.accessToken);
    }
    return NextResponse.json(mapProvisionLeadSessionForClient(payload));
  } catch {
    return NextResponse.json(
      { message: STUDENT_SAFE_USER_MESSAGES.generic },
      { status: 502 },
    );
  }
}
