import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { setPortalSessionCookie } from '@/lib/portal-auth/portal-auth-session.server';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';
import {
  allowlistGoogleRegisterClientPayload,
  extractGoogleSessionCredential,
} from '@/lib/portal-auth/portal-google-register-allowlist';
import { MSG_CRM_CONFIG, MSG_CRM_NETWORK } from '@/lib/crm-student-proxy';
import {
  checkPortalBffRateLimit,
  resolveBffClientIp,
} from '@/lib/portal-bff-rate-limit';

export { allowlistGoogleRegisterClientPayload };

const GOOGLE_FLOWS = new Set([
  'session',
  'register_ticket',
  'password_link',
  'complete_profile',
  'conflict',
]);

function applySessionCookieFromPayload(
  payload: Record<string, unknown>,
): boolean {
  if (payload.flow !== 'session') return true;
  const credential = extractGoogleSessionCredential(payload);
  if (!credential) return false;
  setPortalSessionCookie(credential.actor, credential.accessToken);
  return true;
}

async function proxyPortalGooglePost(options: {
  path: string;
  body: Record<string, unknown>;
  errorFallback: string;
}): Promise<NextResponse> {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: MSG_CRM_CONFIG }, { status: 500 });
  }

  try {
    const url = buildCrmStudentUrl(apiBase, options.path);
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(options.body),
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(data, res.status, options.errorFallback),
        { status: res.status },
      );
    }

    const payload = unwrapCrmResponseBody(data) as Record<string, unknown>;
    if (
      !payload ||
      typeof payload !== 'object' ||
      !GOOGLE_FLOWS.has(String(payload.flow)) ||
      !applySessionCookieFromPayload(payload)
    ) {
      return NextResponse.json(
        { message: 'Phản hồi xác thực từ hệ thống không hợp lệ.' },
        { status: 502 },
      );
    }
    return NextResponse.json(allowlistGoogleRegisterClientPayload(payload));
  } catch {
    return NextResponse.json({ message: MSG_CRM_NETWORK }, { status: 502 });
  }
}

export async function proxyPortalGoogleRegisterOrLogin(
  request: Request,
): Promise<NextResponse> {
  if (
    !checkPortalBffRateLimit(
      'auth-google-register-or-login',
      resolveBffClientIp(request),
      { max: 20 },
    )
  ) {
    return NextResponse.json(
      { message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.' },
      { status: 429 },
    );
  }
  const body = await request.json().catch(() => ({}));
  return proxyPortalGooglePost({
    path: STUDENT_API.authLeadGoogleRegisterOrLogin,
    body: {
      idToken: typeof body?.idToken === 'string' ? body.idToken : '',
      ...(body?.intent === 'mock_test_fast'
        ? { intent: 'mock_test_fast' }
        : {}),
    },
    errorFallback: 'Đăng ký / đăng nhập Google thất bại.',
  });
}

export async function proxyPortalGoogleFinalize(
  request: Request,
): Promise<NextResponse> {
  if (
    !checkPortalBffRateLimit(
      'auth-google-finalize',
      resolveBffClientIp(request),
      { max: 15 },
    )
  ) {
    return NextResponse.json(
      { message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.' },
      { status: 429 },
    );
  }
  const body = await request.json().catch(() => ({}));
  const crmBody: Record<string, unknown> = {
    ticket: typeof body?.ticket === 'string' ? body.ticket : '',
    password: typeof body?.password === 'string' ? body.password : '',
  };
  if (typeof body?.phone === 'string') crmBody.phone = body.phone;
  if (typeof body?.displayName === 'string') {
    crmBody.displayName = body.displayName;
  }
  const registrationId = Number(body?.registrationId);
  if (Number.isInteger(registrationId) && registrationId > 0) {
    crmBody.registrationId = registrationId;
  }

  return proxyPortalGooglePost({
    path: STUDENT_API.authLeadGoogleFinalize,
    body: crmBody,
    errorFallback: 'Hoàn tất đăng ký Google thất bại.',
  });
}

export async function proxyPortalGoogleMockTestFastFinalize(
  request: Request,
): Promise<NextResponse> {
  if (
    !checkPortalBffRateLimit(
      'auth-google-mock-test-fast-finalize',
      resolveBffClientIp(request),
      { max: 15 },
    )
  ) {
    return NextResponse.json(
      { message: 'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.' },
      { status: 429 },
    );
  }
  const body = await request.json().catch(() => ({}));
  return proxyPortalGooglePost({
    path: STUDENT_API.authLeadGoogleMockTestFastFinalize,
    body: {
      ticket: typeof body?.ticket === 'string' ? body.ticket : '',
      displayName:
        typeof body?.displayName === 'string' ? body.displayName : '',
      ...(typeof body?.phone === 'string' ? { phone: body.phone } : {}),
      consentMarketing: body?.consentMarketing === true,
    },
    errorFallback: 'Hoàn tất đăng ký nhanh Google thất bại.',
  });
}
