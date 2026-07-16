import { NextResponse } from 'next/server';
import { getLeadAccessTokenFromCookie } from '@/lib/lead-auth-cookie';
import { getApiBaseUrl } from '@/lib/env';
import { mapLeadMeForClient } from '@/lib/lead-portal/lead-profile-client';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';
import { STUDENT_API } from '@/lib/student-api';
import { buildCrmStudentUrl, unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { applyLeadIdentityUpgradeCookies } from '@/lib/portal-auth/portal-auth-session.server';
import type { LeadMeCrmPayload } from '@/lib/portal-auth/portal-auth-session';

const JSON_HEADERS: HeadersInit = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/** SSR/BFF — fetch lead/me + cookie upgrade + client DTO. */
export async function fetchLeadMeBffResponse(): Promise<NextResponse> {
  const token = getLeadAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }
  const url = buildCrmStudentUrl(apiBase, STUDENT_API.leadMe);
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(data, res.status, 'Không tải được hồ sơ.'),
        { status: res.status },
      );
    }
    const raw = unwrapCrmResponseBody(data) ?? data;
    const upgraded = applyLeadIdentityUpgradeCookies(raw as LeadMeCrmPayload);
    return NextResponse.json(mapLeadMeForClient(upgraded));
  } catch {
    return NextResponse.json(
      { message: 'Không thể kết nối. Vui lòng thử lại.' },
      { status: 502 },
    );
  }
}

export async function patchLeadMeBffResponse(body: unknown): Promise<NextResponse> {
  const token = getLeadAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }
  const url = buildCrmStudentUrl(apiBase, STUDENT_API.leadMe);
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(data, res.status, 'Không cập nhật được hồ sơ.'),
        { status: res.status },
      );
    }
    const raw = unwrapCrmResponseBody(data) ?? data;
    const upgraded = applyLeadIdentityUpgradeCookies(raw as LeadMeCrmPayload);
    return NextResponse.json(mapLeadMeForClient(upgraded));
  } catch {
    return NextResponse.json(
      { message: 'Không thể kết nối. Vui lòng thử lại.' },
      { status: 502 },
    );
  }
}

/** POST lead/me/complete-profile — đánh dấu hoàn thiện hồ sơ (mở layout). */
export async function completeLeadProfileBffResponse(
  body: unknown,
): Promise<NextResponse> {
  const token = getLeadAccessTokenFromCookie();
  if (!token) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }
  const url = buildCrmStudentUrl(apiBase, STUDENT_API.leadCompleteProfile);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...JSON_HEADERS, Authorization: `Bearer ${token}` },
      body: JSON.stringify(body ?? {}),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(
          data,
          res.status,
          'Không hoàn thiện được hồ sơ.',
        ),
        { status: res.status },
      );
    }
    const raw = unwrapCrmResponseBody(data) ?? data;
    const upgraded = applyLeadIdentityUpgradeCookies(raw as LeadMeCrmPayload);
    return NextResponse.json(mapLeadMeForClient(upgraded));
  } catch {
    return NextResponse.json(
      { message: 'Không thể kết nối. Vui lòng thử lại.' },
      { status: 502 },
    );
  }
}
