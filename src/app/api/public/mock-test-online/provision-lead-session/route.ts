import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { setPortalSessionCookie } from '@/lib/portal-auth/portal-auth-session.server';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { resolveConfirmSessionOwnership } from '@/features/portal-mock-test/server/assert-confirm-session-ownership.server';
import {
  mapMockTestBffErrorForClient,
  mapProvisionLeadSessionForClient,
} from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';

/**
 * PI-D13 — mint Lead JWT sau Zalo.
 * P0: bắt buộc funnel cookie sở hữu `pendingRegistrationId` (không mint theo registrationId tuần tự).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    registrationId?: number;
    pendingRegistrationId?: string;
  };
  const pendingRegistrationId =
    typeof body.pendingRegistrationId === 'string'
      ? body.pendingRegistrationId.trim()
      : '';
  const registrationId = Number(body.registrationId);

  if (!pendingRegistrationId || pendingRegistrationId.length < 8) {
    return NextResponse.json(
      { message: 'Cần pendingRegistrationId hợp lệ.' },
      { status: 400 },
    );
  }

  const ownership = await resolveConfirmSessionOwnership(pendingRegistrationId);
  if (!ownership.ok) {
    return NextResponse.json(
      { message: ownership.message },
      { status: ownership.status },
    );
  }

  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }

  const url = `${apiBase.replace(/\/$/, '')}/api/v1/public/mock-test-online/provision-lead-session`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        pendingRegistrationId,
        ...(Number.isFinite(registrationId) && registrationId >= 1
          ? { registrationId }
          : {}),
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
      setPortalSessionCookie('lead', payload.accessToken);
    }
    return NextResponse.json(mapProvisionLeadSessionForClient(payload));
  } catch {
    return NextResponse.json(
      { message: STUDENT_SAFE_USER_MESSAGES.generic },
      { status: 502 },
    );
  }
}
