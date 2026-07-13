import { NextRequest, NextResponse } from 'next/server';

import { mapDictionarySearchPayload } from '@/features/learning/dictionary/dictionary-bff.mapper';
import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';
import {
  checkPortalBffRateLimit,
  resolveBffClientIp,
} from '@/lib/portal-bff-rate-limit';

export async function GET(request: NextRequest) {
  const ip = resolveBffClientIp(request);
  if (!checkPortalBffRateLimit('dictionary-search', ip, { max: 60 })) {
    return NextResponse.json(
      { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';
  const page = searchParams.get('page') ?? '1';
  const path = `learning/dictionary/search?q=${encodeURIComponent(q)}&page=${encodeURIComponent(page)}`;
  const response = await proxyStudentCrmGet(request, path);
  if (!response.ok) {
    return response;
  }

  try {
    const raw = await response.json();
    return NextResponse.json(mapDictionarySearchPayload(raw), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không tìm được từ trong từ điển.' },
      { status: 502 },
    );
  }
}
