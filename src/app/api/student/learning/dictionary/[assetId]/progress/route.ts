import { NextRequest, NextResponse } from 'next/server';

import { mapDictionaryProgressPayload } from '@/features/learning/dictionary/dictionary-bff.mapper';
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
  const response = await proxyStudentCrmGet(
    request,
    `learning/dictionary/${encodeURIComponent(assetId)}/progress`,
  );
  if (!response.ok) {
    return response;
  }

  try {
    const raw = await response.json();
    return NextResponse.json(mapDictionaryProgressPayload(raw), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch {
    return NextResponse.json(
      { message: 'Không tải được tiến độ từ.' },
      { status: 502 },
    );
  }
}
