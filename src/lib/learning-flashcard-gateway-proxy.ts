/**
 * Flashcard session BFF — Portal → Gateway; authorize CRM gộp khi start.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { resolveStudentCustomerIdViaCrmMe } from '@/lib/crm-student-me';
import { authorizeFlashcardViaCrm } from '@/lib/flashcard-crm-authorize';
import {
  buildGatewayServiceHeaders,
  gatewayConfigErrorResponse,
  gatewayUnauthorizedResponse,
  getSocialGatewayConfig,
  proxyGatewayJsonResponse,
} from '@/lib/social-gateway-bff.util';
import { STUDENT_SAFE_USER_MESSAGES, isUpstreamConnectionFailure } from '@/lib/student-safe-errors';

const FLASHCARD_INTERNAL_PREFIX =
  '/api/v1/runtime/learning-drill/internal/student/learning/flashcard';

function internalFlashcardUrl(baseUrl: string, subPath: string): string {
  return `${baseUrl}${FLASHCARD_INTERNAL_PREFIX}/${subPath.replace(/^\//, '')}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type FlashcardGatewayContext = {
  customerId: number;
  cfg: NonNullable<ReturnType<typeof getSocialGatewayConfig>>;
};

async function resolveFlashcardGatewayContext(
  request: NextRequest,
): Promise<FlashcardGatewayContext | NextResponse> {
  const cfg = getSocialGatewayConfig();
  if (!cfg) {
    return gatewayConfigErrorResponse('learning-flashcard-runtime-proxy');
  }
  const customerId = await resolveStudentCustomerIdViaCrmMe(request);
  if (customerId === null) {
    return gatewayUnauthorizedResponse();
  }
  return { customerId, cfg };
}

async function fetchFlashcardGateway(
  cfg: FlashcardGatewayContext['cfg'],
  subPath: string,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetch(internalFlashcardUrl(cfg.baseUrl, subPath), {
      ...init,
      headers: { ...buildGatewayServiceHeaders(cfg), ...init?.headers },
      cache: 'no-store',
    });
  } catch (err) {
    if (isUpstreamConnectionFailure(err)) {
      return new Response(
        JSON.stringify({ message: STUDENT_SAFE_USER_MESSAGES.serverConfig }),
        { status: 503, headers: { 'Content-Type': 'application/json' } },
      );
    }
    throw err;
  }
}

export async function proxyFlashcardRuntimeToGateway(
  request: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  const ctx = await resolveFlashcardGatewayContext(request);
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const { customerId, cfg } = ctx;

  if (request.method === 'POST' && segments[0] === 'sessions' && segments.length === 1) {
    const body = (await request.json().catch(() => ({}))) as {
      classId?: number;
      classSessionId?: number;
      context?: unknown;
    };

    let context = body.context;
    let sessionConfigForClient: Record<string, unknown> | undefined;
    if (!context) {
      const classId = Number(body.classId);
      const classSessionId = Number(body.classSessionId);
      if (!Number.isFinite(classId) || classId < 1 || !Number.isFinite(classSessionId) || classSessionId < 1) {
        return NextResponse.json(
          { message: 'Thiếu classId hoặc classSessionId hợp lệ.' },
          { status: 400 },
        );
      }
      const auth = await authorizeFlashcardViaCrm(request, { classId, classSessionId });
      if (auth === null) {
        return gatewayUnauthorizedResponse();
      }
      if (!auth.allowed) {
        return NextResponse.json(
          { message: auth.reason ?? 'Không được phép luyện flashcard.' },
          { status: 403 },
        );
      }
      sessionConfigForClient = auth.sessionConfig;
      context = {
        classId: auth.classId,
        classSessionId: auth.classSessionId,
        courseSessionId: auth.courseSessionId,
        sessionConfig: auth.sessionConfig,
        cards: auth.cards,
      };
    }

    const res = await fetchFlashcardGateway(cfg, 'sessions', {
      method: 'POST',
      body: JSON.stringify({ customerId, context }),
    });
    const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (sessionConfigForClient && res.ok) {
      payload.sessionConfig = sessionConfigForClient;
    }
    return NextResponse.json(payload, { status: res.status });
  }

  if (
    request.method === 'POST' &&
    segments[0] === 'sessions' &&
    segments.length === 3 &&
    segments[2] === 'review'
  ) {
    const sessionId = segments[1];
    if (!UUID_RE.test(sessionId)) {
      return NextResponse.json({ message: STUDENT_SAFE_USER_MESSAGES.notFound }, { status: 404 });
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const res = await fetchFlashcardGateway(cfg, `sessions/${sessionId}/review`, {
      method: 'POST',
      body: JSON.stringify({ customerId, ...body }),
    });
    return proxyGatewayJsonResponse(res);
  }

  if (
    request.method === 'POST' &&
    segments[0] === 'sessions' &&
    segments.length === 3 &&
    segments[2] === 'complete'
  ) {
    const sessionId = segments[1];
    if (!UUID_RE.test(sessionId)) {
      return NextResponse.json({ message: STUDENT_SAFE_USER_MESSAGES.notFound }, { status: 404 });
    }
    const res = await fetchFlashcardGateway(cfg, `sessions/${sessionId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ customerId }),
    });
    return proxyGatewayJsonResponse(res);
  }

  return NextResponse.json({ message: STUDENT_SAFE_USER_MESSAGES.notFound }, { status: 404 });
}
