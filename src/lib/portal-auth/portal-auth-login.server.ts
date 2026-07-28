import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { STUDENT_API } from '@/lib/student-api';
import type { PortalLoginActorPayload } from '@/lib/portal-auth/portal-auth-session';
import { respondPortalPasswordLoginSuccess } from '@/lib/portal-auth/apply-portal-auth-success.server';

/** Proxy password login CRM thống nhất — `POST /student/auth/login`. */
export async function proxyPortalAuthLoginPost(
  request: Request,
): Promise<NextResponse> {
  const body = await request.json();
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }

  const url = buildCrmStudentUrl(apiBase, STUDENT_API.authLogin);
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
  return respondPortalPasswordLoginSuccess(payload);
}
