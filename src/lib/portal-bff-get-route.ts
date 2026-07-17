import { NextResponse } from 'next/server';
import {
  checkPortalBffRateLimit,
  resolveBffClientIp,
} from '@/lib/portal-bff-rate-limit';
import {
  sanitizeStudentFacingMessage,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';

const PORTAL_BFF_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120',
} as const;

export type PortalBffGetOptions<T> = {
  request: Request;
  rateLimitBucket: string;
  errorMessage: string;
  fetch: (locale: string) => Promise<T>;
};

/** SSOT handler GET BFF portal — rate limit + locale + cache headers. */
export async function handlePortalBffGet<T>(
  options: PortalBffGetOptions<T>,
): Promise<NextResponse> {
  const ip = resolveBffClientIp(options.request);

  if (!checkPortalBffRateLimit(options.rateLimitBucket, ip)) {
    return NextResponse.json(
      { message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
      { status: 429 },
    );
  }

  const { searchParams } = new URL(options.request.url);
  const locale = searchParams.get('locale') ?? 'vi-VN';

  try {
    const payload = await options.fetch(locale);
    return NextResponse.json(payload, { headers: PORTAL_BFF_CACHE_HEADERS });
  } catch (e) {
    const fallback =
      options.errorMessage || STUDENT_SAFE_USER_MESSAGES.network;
    return NextResponse.json(
      {
        message: sanitizeStudentFacingMessage(
          e instanceof Error ? e.message : undefined,
          fallback,
        ),
      },
      { status: 502 },
    );
  }
}
