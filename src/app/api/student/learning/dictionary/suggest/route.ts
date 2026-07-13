import { NextRequest, NextResponse } from 'next/server';

import { mapDictionarySuggestPayload } from '@/features/learning/dictionary/dictionary-bff.mapper';
import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';
import {
  checkPortalBffRateLimit,
  resolveBffClientIp,
} from '@/lib/portal-bff-rate-limit';

export async function GET(request: NextRequest) {
  const ip = resolveBffClientIp(request);
  if (!checkPortalBffRateLimit('dictionary-suggest', ip, { max: 120 })) {
    return NextResponse.json(
      { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      { status: 429 },
    );
  }

  const q = new URL(request.url).searchParams.get('q') ?? '';
  const path = `learning/dictionary/suggest?q=${encodeURIComponent(q)}`;
  const response = await proxyStudentCrmGet(request, path);
  if (!response.ok) {
    return response;
  }

  try {
    const raw = await response.json();
    return NextResponse.json(mapDictionarySuggestPayload(raw), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không tải được gợi ý từ.' },
      { status: 502 },
    );
  }
}
