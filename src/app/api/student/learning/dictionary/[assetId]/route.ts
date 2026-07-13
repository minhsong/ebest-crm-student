import { NextRequest, NextResponse } from 'next/server';

import { isDictionaryLookupSource, mapDictionaryDetailPayload } from '@/features/learning/dictionary/dictionary-bff.mapper';
import { proxyStudentCrmGet } from '@/lib/student-crm-proxy';
import {
  checkPortalBffRateLimit,
  resolveBffClientIp,
} from '@/lib/portal-bff-rate-limit';

type Params = { params: Promise<{ assetId: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const ip = resolveBffClientIp(request);
  if (!checkPortalBffRateLimit('dictionary-detail', ip, { max: 180 })) {
    return NextResponse.json(
      { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      { status: 429 },
    );
  }

  const { assetId } = await params;
  const rawSource = request.nextUrl.searchParams.get('source');
  const source =
    rawSource && isDictionaryLookupSource(rawSource)
      ? rawSource
      : null;
  const query = source ? `?source=${encodeURIComponent(source)}` : '';
  const response = await proxyStudentCrmGet(
    request,
    `learning/dictionary/${encodeURIComponent(assetId)}${query}`,
  );
  if (!response.ok) {
    return response;
  }

  try {
    const raw = await response.json();
    const payload = mapDictionaryDetailPayload(raw);
    return NextResponse.json(payload, {
      headers: { 'Cache-Control': 'private, max-age=60' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không tải được chi tiết từ.' },
      { status: 502 },
    );
  }
}
