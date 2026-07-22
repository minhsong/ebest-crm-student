import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import {
  MSG_CRM_CONFIG,
  MSG_CRM_NETWORK,
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { STUDENT_API } from '@/lib/student-api';
import {
  readAccessTokenFromCrmPayload,
  respondPortalCustomerSessionSuccess,
} from '@/lib/portal-auth/apply-portal-auth-success.server';
import {
  logInternalApiError,
  sanitizeStudentFacingMessage,
} from '@/lib/student-safe-errors';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';

/**
 * Tạo tài khoản qua complete-profile token — UPA-Q5: set cookie session ngay.
 * Không trả accessToken ra browser. Cùng SSOT cookie với login/Google.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: MSG_CRM_CONFIG }, { status: 500 });
  }

  try {
    const url = buildCrmStudentUrl(apiBase, STUDENT_API.authRegisterByToken);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        token: typeof body?.token === 'string' ? body.token : '',
        password: typeof body?.password === 'string' ? body.password : '',
      }),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(data, res.status, 'Tạo tài khoản thất bại.'),
        { status: res.status },
      );
    }

    const payload = unwrapCrmResponseBody(data) as Record<string, unknown>;
    if (!readAccessTokenFromCrmPayload(payload)) {
      logInternalApiError(
        'auth-register-by-token',
        'Phản hồi tạo tài khoản thiếu accessToken.',
        {
          path: STUDENT_API.authRegisterByToken,
          method: 'POST',
          errorType: 'missing_access_token',
        },
      );
      return NextResponse.json(
        { message: 'Phản hồi xác thực từ hệ thống không hợp lệ.' },
        { status: 502 },
      );
    }

    return respondPortalCustomerSessionSuccess({
      payload,
      messageFallback: 'Tạo tài khoản thành công. Bạn đã được đăng nhập.',
      sanitizeMessage: sanitizeStudentFacingMessage,
    });
  } catch (error) {
    logInternalApiError('auth-register-by-token', error, {
      path: STUDENT_API.authRegisterByToken,
      method: 'POST',
      errorType: 'crm_network',
    });
    return NextResponse.json({ message: MSG_CRM_NETWORK }, { status: 502 });
  }
}
