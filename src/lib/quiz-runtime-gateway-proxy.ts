import { NextResponse } from 'next/server';

import type { NextRequest } from 'next/server';

import { resolveStudentCustomerIdViaCrmMe } from '@/lib/crm-student-me';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function gatewayConfig(): { baseUrl: string; serviceToken: string } | null {
  const baseUrl = process.env.SOCIAL_GATEWAY_BASE_URL?.replace(/\/$/, '') ?? '';
  const serviceToken = process.env.SOCIAL_GATEWAY_SERVICE_TOKEN?.trim() ?? '';
  if (!baseUrl || !serviceToken) return null;
  return { baseUrl, serviceToken };
}

function publicUrl(baseUrl: string, subPath: string): string {
  const p = subPath.replace(/^\//, '');
  return `${baseUrl}/api/v1/runtime/test-quiz/public/${p}`;
}

function internalStudentUrl(baseUrl: string, subPath: string): string {
  const p = subPath.replace(/^\//, '');
  return `${baseUrl}/api/v1/runtime/test-quiz/internal/student/${p}`;
}

async function jsonResponse(upstream: Response): Promise<NextResponse> {
  const data = await upstream.json().catch(() => {
    const alt: Record<string, unknown> = {};
    return alt;
  });
  return NextResponse.json(data, { status: upstream.status });
}

/**
 * Quiz runtime: Portal server → Social Gateway (không qua CRM).
 * Đọc `customerId` từ JWT học viên; gateway internal/student tin CRM service Bearer.
 */
export async function proxyQuizRuntimeToGateway(
  request: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  const cfg = gatewayConfig();
  if (!cfg) {
    return NextResponse.json(
      {
        message:
          'Quiz gateway chưa cấu hình. Đặt SOCIAL_GATEWAY_BASE_URL và SOCIAL_GATEWAY_SERVICE_TOKEN trên server Portal.',
      },
      { status: 500 },
    );
  }

  const customerId = await resolveStudentCustomerIdViaCrmMe(request);
  if (customerId === null) {
    return NextResponse.json(
      {
        message:
          'Chưa đăng nhập, phiên không hợp lệ, hoặc không gọi được CRM GET /student/me (kiểm tra CRM_API_URL).',
      },
      { status: 401 },
    );
  }

  const method = request.method;
  const search = request.nextUrl.search ?? '';
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  const serviceAuth = {
    Authorization: `Bearer ${cfg.serviceToken}`,
    'Content-Type': 'application/json',
  } as const;

  const [a, b, c, d] = segments;

  if (method === 'GET' && segments.length === 1 && a === 'forms') {
    const res = await fetch(publicUrl(cfg.baseUrl, `forms${search}`), {
      headers,
      cache: 'no-store',
    });
    return jsonResponse(res);
  }

  if (method === 'GET' && segments.length === 2 && a === 'forms' && b === 'progress') {
    const sp = new URLSearchParams(search.replace(/^\?/, ''));
    if (!sp.has('customerId')) sp.set('customerId', String(customerId));
    const qInner = `?${sp.toString()}`;
    const res = await fetch(internalStudentUrl(cfg.baseUrl, `forms/progress${qInner}`), {
      headers: { ...headers, ...serviceAuth },
      cache: 'no-store',
    });
    return jsonResponse(res);
  }

  if (method === 'GET' && segments.length === 2 && a === 'forms' && isUuid(b)) {
    const res = await fetch(publicUrl(cfg.baseUrl, `forms/${b}${search}`), {
      headers,
      cache: 'no-store',
    });
    return jsonResponse(res);
  }

  if (
    method === 'GET' &&
    segments.length === 3 &&
    a === 'forms' &&
    isUuid(b) &&
    c === 'active-attempt'
  ) {
    const res = await fetch(
      internalStudentUrl(
        cfg.baseUrl,
        `forms/${b}/active-attempt?customerId=${String(customerId)}`,
      ),
      {
        headers: { ...headers, ...serviceAuth },
        cache: 'no-store',
      },
    );
    return jsonResponse(res);
  }

  if (
    method === 'GET' &&
    segments.length === 3 &&
    a === 'forms' &&
    isUuid(b) &&
    c === 'attempts'
  ) {
    const res = await fetch(
      internalStudentUrl(
        cfg.baseUrl,
        `forms/${b}/attempts?customerId=${String(customerId)}`,
      ),
      {
        headers: { ...headers, ...serviceAuth },
        cache: 'no-store',
      },
    );
    return jsonResponse(res);
  }

  if (method === 'GET' && segments.length === 1 && a === 'progress') {
    const sp = new URLSearchParams(search.replace(/^\?/, ''));
    sp.set('customerId', String(customerId));
    const qInner = `?${sp.toString()}`;
    const res = await fetch(internalStudentUrl(cfg.baseUrl, `progress${qInner}`), {
      headers: { ...headers, ...serviceAuth },
      cache: 'no-store',
    });
    return jsonResponse(res);
  }

  if (method === 'POST' && segments.length === 3 && a === 'forms' && isUuid(b) && c === 'attempts') {
    let snapshot: Record<string, unknown> | undefined;
    const ct = request.headers.get('content-type') ?? '';
    if (ct.includes('application/json')) {
      try {
        const raw = (await request.json()) as { participantSnapshot?: unknown };
        if (raw && typeof raw.participantSnapshot === 'object' && raw.participantSnapshot) {
          snapshot = raw.participantSnapshot as Record<string, unknown>;
        }
      } catch {
        snapshot = undefined;
      }
    }
    const body: { customerId: number; participantSnapshot?: Record<string, unknown> } = {
      customerId,
    };
    if (snapshot) body.participantSnapshot = snapshot;
    const res = await fetch(internalStudentUrl(cfg.baseUrl, `forms/${b}/attempts`), {
      method: 'POST',
      headers: { ...headers, ...serviceAuth },
      body: JSON.stringify(body),
    });
    return jsonResponse(res);
  }

  if (
    method === 'GET' &&
    segments.length === 4 &&
    a === 'forms' &&
    isUuid(b) &&
    c === 'attempts' &&
    d === 'active'
  ) {
    const sp = new URLSearchParams(search.replace(/^\?/, ''));
    if (!sp.has('customerId')) sp.set('customerId', String(customerId));
    const qInner = `?${sp.toString()}`;
    const res = await fetch(internalStudentUrl(cfg.baseUrl, `forms/${b}/attempts/active${qInner}`), {
      headers: { ...headers, ...serviceAuth },
      cache: 'no-store',
    });
    return jsonResponse(res);
  }

  if (method === 'GET' && segments.length === 2 && a === 'attempts' && isUuid(b)) {
    const sp = new URLSearchParams(search.replace(/^\?/, ''));
    if (!sp.has('customerId')) sp.set('customerId', String(customerId));
    const qInner = sp.toString() ? `?${sp.toString()}` : `?customerId=${String(customerId)}`;
    const res = await fetch(internalStudentUrl(cfg.baseUrl, `attempts/${b}${qInner}`), {
      headers: { ...headers, ...serviceAuth },
      cache: 'no-store',
    });
    return jsonResponse(res);
  }

  if (
    method === 'PATCH' &&
    segments.length === 3 &&
    a === 'attempts' &&
    isUuid(b) &&
    c === 'answers'
  ) {
    let answersByFormItemId: Record<string, unknown> = {};
    try {
      const raw = (await request.json()) as { answersByFormItemId?: unknown };
      if (raw && typeof raw.answersByFormItemId === 'object' && raw.answersByFormItemId) {
        answersByFormItemId = raw.answersByFormItemId as Record<string, unknown>;
      }
    } catch {
      answersByFormItemId = {};
    }
    const res = await fetch(internalStudentUrl(cfg.baseUrl, `attempts/${b}/answers`), {
      method: 'PATCH',
      headers: { ...headers, ...serviceAuth },
      body: JSON.stringify({ customerId, answersByFormItemId }),
    });
    return jsonResponse(res);
  }

  if (
    method === 'POST' &&
    segments.length === 3 &&
    a === 'attempts' &&
    isUuid(b) &&
    c === 'submit'
  ) {
    const res = await fetch(internalStudentUrl(cfg.baseUrl, `attempts/${b}/submit`), {
      method: 'POST',
      headers: { ...headers, ...serviceAuth },
      body: JSON.stringify({ customerId }),
    });
    return jsonResponse(res);
  }

  return NextResponse.json({ message: 'Unsupported quiz-runtime path or method.' }, { status: 404 });
}
