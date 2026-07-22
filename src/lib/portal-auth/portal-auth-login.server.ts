import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import type { PortalLoginMode } from '@/components/portal/PortalLoginModePicker';
import type { PortalLoginActorPayload } from '@/lib/portal-auth/portal-auth-session';
import { PORTAL_LOGIN_CRM_PATH } from '@/lib/portal-auth/portal-login-api';
import { respondPortalPasswordLoginSuccess } from '@/lib/portal-auth/apply-portal-auth-success.server';

/** Proxy login CRM + set cookie — dùng chung `/api/auth/login` và `/api/auth/lead/login`. */
export async function proxyPortalAuthLoginPost(
  request: Request,
  mode: PortalLoginMode,
): Promise<NextResponse> {
  const body = await request.json();
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }

  const url = buildCrmStudentUrl(apiBase, PORTAL_LOGIN_CRM_PATH[mode]);
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json(
      typeof data?.message === 'string' ? { message: data.message } : data,
      { status: res.status },
    );
  }

  const payload = unwrapCrmResponseBody(data) as PortalLoginActorPayload;
  return respondPortalPasswordLoginSuccess(mode, payload);
}
