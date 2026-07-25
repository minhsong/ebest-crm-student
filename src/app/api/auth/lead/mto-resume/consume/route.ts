import { NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { STUDENT_API } from '@/lib/student-api';
import {
  applyPortalAccessTokenCookie,
  readAccessTokenFromCrmPayload,
} from '@/lib/portal-auth/apply-portal-auth-success.server';

type LeadSessionPayload = {
  kind?: 'lead_session';
  accessToken?: string;
  account?: {
    id: number;
    displayName: string | null;
    email: string;
    phoneE164: string | null;
    profileCompleted: boolean;
    passwordSetupRequired: boolean;
  };
  nextPath?: string;
};

/** Public — đổi token resume → cookie portal_at (PO-D22). Omni funnel retired. */
export async function POST(request: Request) {
  const body = await request.json();
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }

  const url = buildCrmStudentUrl(apiBase, STUDENT_API.authLeadMtoResumeConsume);
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

  const payload = unwrapCrmResponseBody(data) as LeadSessionPayload;
  const token = readAccessTokenFromCrmPayload(payload);
  if (!token) {
    return NextResponse.json(
      { message: 'Phản hồi thiếu phiên đăng nhập.' },
      { status: 502 },
    );
  }

  applyPortalAccessTokenCookie('lead', token);

  return NextResponse.json({
    kind: 'lead_session' as const,
    actor: 'lead' as const,
    account: payload.account ?? null,
    nextPath:
      typeof payload.nextPath === 'string' && payload.nextPath.trim()
        ? payload.nextPath
        : '/mock-test',
  });
}
