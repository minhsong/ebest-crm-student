import { NextResponse } from 'next/server';
import { setLeadPortalSessionCookieIfSafe } from '@/lib/portal-auth/portal-auth-session.server';
import { resolveConfirmSessionOwnership } from '@/features/mock-test-online/shared/server';
import {
  mapMockTestBffErrorForClient,
  mapProvisionLeadSessionForClient,
} from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { mockTestBffCatchResponse } from '@/lib/public-mock-test-online/mock-test-bff-catch-response';
import { fetchPublicMockTestCrmJson } from '@/lib/public-mock-test-online/proxy-public-mock-test-crm.server';
import { resolvePortalSessionFromCookies } from '@/lib/portal-auth/resolve-portal-session.server';
import { withMtoBffRequest } from '@/lib/public-mock-test-online/with-mto-bff-request';

/**
 * PI-D13 — mint Lead JWT sau Zalo.
 * Ownership gate (mto-ownership) → CRM provision → set portal_at.
 * Lỗi intermediate: log module rồi rethrow; terminal: mockTestBffCatchResponse.
 */
export async function POST(request: Request) {
  return withMtoBffRequest(request, async (requestId) => {
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
        { message: 'Cần pendingRegistrationId hợp lệ.', requestId },
        { status: 400, headers: { 'X-Request-Id': requestId } },
      );
    }

    try {
      const ownership = await resolveConfirmSessionOwnership(
        pendingRegistrationId,
      );
      if (!ownership.ok) {
        return NextResponse.json(
          { message: ownership.message, requestId },
          {
            status: ownership.status,
            headers: { 'X-Request-Id': requestId },
          },
        );
      }

      const portalSession = await resolvePortalSessionFromCookies();
      if (portalSession.actor === 'customer') {
        return NextResponse.json(
          {
            skipped: true,
            reason: 'customer_session',
            sessionReady: true,
            requestId,
          },
          { headers: { 'X-Request-Id': requestId } },
        );
      }

      const result = await fetchPublicMockTestCrmJson<{ accessToken?: string }>(
        {
          path: 'provision-lead-session',
          method: 'POST',
          body: {
            pendingRegistrationId,
            ...(Number.isFinite(registrationId) && registrationId >= 1
              ? { registrationId }
              : {}),
          },
          logContext: 'provision-lead-session',
        },
      );
      if (result.configMissing) {
        return NextResponse.json(
          { message: 'Cấu hình server chưa đúng.', requestId },
          { status: 500, headers: { 'X-Request-Id': requestId } },
        );
      }
      if (!result.ok) {
        return NextResponse.json(
          {
            ...mapMockTestBffErrorForClient(
              result.raw,
              result.status,
              'Không tạo được phiên đăng nhập. Vui lòng thử lại.',
            ),
            requestId,
          },
          {
            status: result.status,
            headers: { 'X-Request-Id': requestId },
          },
        );
      }

      const payload = result.data ?? {};
      let sessionReady = false;
      if (payload?.accessToken) {
        const applied = await setLeadPortalSessionCookieIfSafe(
          payload.accessToken,
        );
        sessionReady = applied === 'set' || applied === 'skipped_customer';
      }
      return NextResponse.json(
        {
          ...mapProvisionLeadSessionForClient(payload),
          sessionReady,
          requestId,
        },
        { headers: { 'X-Request-Id': requestId } },
      );
    } catch (error) {
      return mockTestBffCatchResponse(error, {
        errorCode: 'BFF_PROVISION_ERROR',
        module: 'mto-identity',
        operation: 'provision-lead-session',
        path: '/api/public/mock-test-online/provision-lead-session',
        method: 'POST',
        requestId,
      });
    }
  });
}
