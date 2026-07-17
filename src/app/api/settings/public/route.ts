import { NextResponse } from 'next/server';

import { getApiBaseUrl } from '@/lib/env';
import { MSG_CRM_CONFIG, MSG_CRM_NETWORK } from '@/lib/crm-student-proxy';

/** BFF cache TTL — CRM also caches public settings in Redis. */
const REVALIDATE_SEC = 300;

/**
 * Proxy GET public system settings (no auth) — dùng cho Client ID Google trên cổng học viên.
 */
export async function GET() {
  const base = getApiBaseUrl();
  if (!base) {
    return NextResponse.json({ message: MSG_CRM_CONFIG }, { status: 500 });
  }
  const url = `${base.replace(/\/$/, '')}/api/v1/system-settings/public`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: REVALIDATE_SEC },
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const msg =
        typeof data.message === 'string' && data.message.trim()
          ? data.message
          : 'Không tải được cấu hình.';
      return NextResponse.json({ message: msg }, { status: res.status });
    }
    const payload = data.result ?? data.data ?? data;
    return NextResponse.json(payload ?? {}, {
      headers: {
        'Cache-Control': `public, s-maxage=${REVALIDATE_SEC}, stale-while-revalidate=60`,
      },
    });
  } catch {
    return NextResponse.json({ message: MSG_CRM_NETWORK }, { status: 502 });
  }
}
