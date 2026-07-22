import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { setLeadPortalSessionCookieIfSafe } from '@/lib/portal-auth/portal-auth-session.server';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { resolveConfirmSessionOwnership } from '@/features/portal-mock-test/server/assert-confirm-session-ownership.server';
import {
  mapMockTestBffErrorForClient,
  mapProvisionLeadSessionForClient,
} from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';

/**
 * PI-D13 — mint Lead JWT sau Zalo.
 * P0: funnel ownership bắt buộc.
 * UPA: không ghi đè `portal_at` nếu đang là Customer (exam dùng mto_portal_auth).
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

  // HV đã login: không provision Lead (tránh overwrite + CRM reject account_type=customer).
  const portalSession = await resolvePortalSessionFromCookies();
  if (portalSession.actor === 'customer') {
    return NextResponse.json({
      skipped: true,
      reason: 'customer_session',
      sessionReady: true,
    });
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
    let sessionReady = false;
    if (payload?.accessToken) {
      const applied = await setLeadPortalSessionCookieIfSafe(
        payload.accessToken,
      );
      sessionReady = applied === 'set' || applied === 'skipped_customer';
    }
    return NextResponse.json({
      ...mapProvisionLeadSessionForClient(payload),
      sessionReady,
    });
  } catch {
    return NextResponse.json(
      { message: STUDENT_SAFE_USER_MESSAGES.generic },
      { status: 502 },
    );
  }
}
