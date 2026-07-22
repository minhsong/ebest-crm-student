import { NextRequest, NextResponse } from 'next/server';
import { STUDENT_API } from '@/lib/student-api';
import { proxyPortalAuthenticatedPostJson } from '@/lib/crm-student-proxy';
import {
  forcePortalLogoutCookies,
  getPortalAccessTokenFromCookie,
} from '@/lib/portal-auth-cookie';

const ERROR_FALLBACK = 'Đăng ký thi thử thất bại. Vui lòng thử lại.';

/**
 * Actor-agnostic — một cookie `portal_at`; CRM `/portal/mock-test/offline-registrations`
 * phân nhánh Lead|Customer sau verify JWT (BFF không decode accountType).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const token = getPortalAccessTokenFromCookie();
  if (!token?.trim()) {
    forcePortalLogoutCookies();
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }

  return proxyPortalAuthenticatedPostJson({
    path: STUDENT_API.portalOfflineRegistration,
    body,
    errorFallback: ERROR_FALLBACK,
  });
}
