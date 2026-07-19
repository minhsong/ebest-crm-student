import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { STUDENT_API } from '@/lib/student-api';
import {
  buildCrmStudentUrl,
  unwrapCrmResponseBody,
} from '@/lib/crm-student-proxy';
import { mapPortalConflictForClient } from '@/lib/portal-conflict-client';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';

/** W10 — pre-check email/SĐT trước khi submit complete-profile. */
export async function GET(request: NextRequest) {
  const apiBase = getApiBaseUrl();
  if (!apiBase) {
    return NextResponse.json(
      { message: 'Cấu hình server chưa đúng.' },
      { status: 500 },
    );
  }

  const sp = request.nextUrl.searchParams;
  const email = sp.get('email')?.trim();
  const phone = sp.get('phone')?.trim();
  const excludeCustomerId = sp.get('excludeCustomerId')?.trim();

  if (!email && !phone) {
    return NextResponse.json(
      { message: 'Cần email hoặc SĐT.' },
      { status: 400 },
    );
  }

  const qs = new URLSearchParams();
  if (email) qs.set('email', email);
  if (phone) qs.set('phone', phone);
  if (excludeCustomerId) qs.set('excludeCustomerId', excludeCustomerId);

  const url = `${buildCrmStudentUrl(apiBase, STUDENT_API.authCheckLoginKey)}?${qs}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        mapPortalConflictForClient(
          data,
          res.status,
          STUDENT_SAFE_USER_MESSAGES.generic,
        ),
        { status: res.status },
      );
    }
    const payload = (unwrapCrmResponseBody(data) ?? data) as Record<
      string,
      unknown
    >;
    const action =
      payload.action === 'login' || payload.action === 'contact_support'
        ? payload.action
        : undefined;
    return NextResponse.json({
      available: payload.available === true,
      ...(action ? { action } : {}),
    });
  } catch {
    return NextResponse.json(
      { message: STUDENT_SAFE_USER_MESSAGES.generic },
      { status: 502 },
    );
  }
}
