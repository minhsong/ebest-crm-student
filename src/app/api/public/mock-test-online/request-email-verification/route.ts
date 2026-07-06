import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl } from '@/lib/env';
import { unwrapCrmResponseBody } from '@/lib/crm-student-proxy';
import { mapMockTestBffErrorForClient } from '@/lib/public-mock-test-online/mock-test-bff-response.server';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const apiBase = getApiBaseUrl()?.replace(/\/$/, '');
  if (!apiBase) {
    return NextResponse.json({ message: 'Cấu hình server chưa đúng.' }, { status: 500 });
  }
  try {
    const res = await fetch(
      `${apiBase}/api/v1/public/mock-test-online/request-email-verification`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        mapMockTestBffErrorForClient(
          data,
          res.status,
          'Không gửi được email xác nhận.',
        ),
        { status: res.status },
      );
    }
    const payload = unwrapCrmResponseBody(data) ?? data;
    return NextResponse.json(payload);
  } catch {
    return NextResponse.json(
      { message: STUDENT_SAFE_USER_MESSAGES.generic },
      { status: 502 },
    );
  }
}
