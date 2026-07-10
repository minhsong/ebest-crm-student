/**
 * Drill runtime BFF — Portal → Gateway trực tiếp; authorize CRM gộp khi start.
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { resolveStudentCustomerIdViaCrmMe } from '@/lib/crm-student-me';
import { authorizeDrillViaCrm, type DrillAuthorizeResponse } from '@/lib/drill-crm-authorize';
import {
  buildGatewayServiceHeaders,
  gatewayConfigErrorResponse,
  gatewayUnauthorizedResponse,
  getSocialGatewayConfig,
  proxyGatewayJsonResponse,
} from '@/lib/social-gateway-bff.util';
import { STUDENT_SAFE_USER_MESSAGES } from '@/lib/student-safe-errors';
import type { GamePromptType } from '@/features/learning/games/catalog/game-catalog.types';
import type { VocabularyDrillModeId } from '@/features/learning/games/core/types/game-session-config.types';

const DRILL_INTERNAL_PREFIX =
  '/api/v1/runtime/learning-drill/internal/student/learning/drill';

function internalDrillUrl(baseUrl: string, subPath: string): string {
  return `${baseUrl}${DRILL_INTERNAL_PREFIX}/${subPath.replace(/^\//, '')}`;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type DrillGatewayContext = {
  customerId: number;
  cfg: NonNullable<ReturnType<typeof getSocialGatewayConfig>>;
};

async function resolveDrillGatewayContext(
  request: NextRequest,
  proxyName = 'learning-drill-proxy',
): Promise<DrillGatewayContext | NextResponse> {
  const cfg = getSocialGatewayConfig();
  if (!cfg) {
    return gatewayConfigErrorResponse(proxyName);
  }
  const customerId = await resolveStudentCustomerIdViaCrmMe(request);
  if (customerId === null) {
    return gatewayUnauthorizedResponse();
  }
  return { customerId, cfg };
}

async function fetchDrillGateway(
  cfg: DrillGatewayContext['cfg'],
  subPath: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(internalDrillUrl(cfg.baseUrl, subPath), {
    ...init,
    headers: { ...buildGatewayServiceHeaders(cfg), ...init?.headers },
    cache: 'no-store',
  });
}

export async function proxyDrillRuntimeToGateway(
  request: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  const ctx = await resolveDrillGatewayContext(request, 'learning-drill-runtime-proxy');
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const { customerId, cfg } = ctx;

  if (request.method === 'POST' && segments[0] === 'plays' && segments.length === 1) {
    const body = (await request.json().catch(() => ({}))) as {
      classId?: number;
      assignmentId?: number;
      modeId?: VocabularyDrillModeId;
      promptType?: GamePromptType;
      context?: unknown;
    };

    let context = body.context;
    let sessionConfigForClient: Extract<DrillAuthorizeResponse, { allowed: true }>['sessionConfig'] | undefined;
    if (!context) {
      const classId = Number(body.classId);
      if (!Number.isFinite(classId) || classId < 1) {
        return NextResponse.json(
          { message: 'Thiếu classId hợp lệ.' },
          { status: 400 },
        );
      }
      const auth = await authorizeDrillViaCrm(request, {
        classId,
        assignmentId: body.assignmentId,
        modeId: body.modeId,
        promptType: body.promptType,
      });
      if (auth === null) {
        return gatewayUnauthorizedResponse();
      }
      if (!auth.allowed) {
        return NextResponse.json(
          { message: auth.reason ?? 'Không được phép luyện tập.' },
          { status: 403 },
        );
      }
      sessionConfigForClient = auth.sessionConfig;
      context = {
        classId: auth.classId,
        courseId: auth.courseId,
        assignmentId: auth.assignmentId,
        sessionConfig: auth.sessionConfig,
        rules: auth.rules,
        pool: auth.pool,
      };
    }

    const res = await fetchDrillGateway(cfg, 'plays', {
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
    request.method === 'GET' &&
    segments[0] === 'plays' &&
    segments.length === 2 &&
    segments[1] === 'active'
  ) {
    const classId = request.nextUrl.searchParams.get('classId');
    const promptType = request.nextUrl.searchParams.get('promptType');
    if (!classId || !promptType) {
      return NextResponse.json(
        { message: 'Thiếu tham số classId hoặc promptType.' },
        { status: 400 },
      );
    }
    const qs = new URLSearchParams({
      customerId: String(customerId),
      classId,
      promptType,
    });
    const res = await fetchDrillGateway(cfg, `plays/active?${qs.toString()}`);
    return proxyGatewayJsonResponse(res);
  }

  if (request.method === 'GET' && segments[0] === 'plays' && segments.length === 2) {
    const playId = segments[1];
    if (!UUID_RE.test(playId)) {
      return NextResponse.json({ message: STUDENT_SAFE_USER_MESSAGES.notFound }, { status: 404 });
    }
    const res = await fetchDrillGateway(
      cfg,
      `plays/${playId}?customerId=${customerId}`,
    );
    return proxyGatewayJsonResponse(res);
  }

  if (
    request.method === 'POST' &&
    segments[0] === 'plays' &&
    segments.length === 3 &&
    segments[2] === 'abandon'
  ) {
    const playId = segments[1];
    if (!UUID_RE.test(playId)) {
      return NextResponse.json({ message: STUDENT_SAFE_USER_MESSAGES.notFound }, { status: 404 });
    }
    const res = await fetchDrillGateway(
      cfg,
      `plays/${playId}/abandon?customerId=${customerId}`,
      { method: 'POST' },
    );
    return proxyGatewayJsonResponse(res);
  }

  if (
    request.method === 'POST' &&
    segments[0] === 'plays' &&
    segments.length === 3 &&
    segments[2] === 'answer'
  ) {
    const playId = segments[1];
    if (!UUID_RE.test(playId)) {
      return NextResponse.json({ message: STUDENT_SAFE_USER_MESSAGES.notFound }, { status: 404 });
    }
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const res = await fetchDrillGateway(cfg, `plays/${playId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ customerId, ...body }),
    });
    return proxyGatewayJsonResponse(res);
  }

  return NextResponse.json({ message: STUDENT_SAFE_USER_MESSAGES.notFound }, { status: 404 });
}

/** Week drill score — rollup Gateway (Hub widget). */
export async function proxyDrillWeekScoreToGateway(
  request: NextRequest,
): Promise<NextResponse> {
  const ctx = await resolveDrillGatewayContext(request, 'learning-drill-stats-proxy');
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const { customerId, cfg } = ctx;
  const qs = new URLSearchParams({ customerId: String(customerId) });
  const res = await fetchDrillGateway(cfg, `stats/week-score?${qs.toString()}`);
  return proxyGatewayJsonResponse(res);
}

/** Leaderboard — Mongo rollups Gateway + CRM present (ADR DRG-P3). */
export async function proxyDrillLeaderboardToGateway(
  request: NextRequest,
): Promise<NextResponse> {
  const ctx = await resolveDrillGatewayContext(request, 'learning-drill-analytics-proxy');
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const { customerId, cfg } = ctx;
  const classId = request.nextUrl.searchParams.get('classId');
  const scope = request.nextUrl.searchParams.get('scope');
  const period = request.nextUrl.searchParams.get('period');
  const boardKind = request.nextUrl.searchParams.get('boardKind');
  const page = request.nextUrl.searchParams.get('page');
  const pageSize = request.nextUrl.searchParams.get('pageSize');
  const q = request.nextUrl.searchParams.get('q');
  const filterClassId = request.nextUrl.searchParams.get('filterClassId');
  const promptType = request.nextUrl.searchParams.get('promptType');
  const modeId = request.nextUrl.searchParams.get('modeId');
  if (!classId || !scope || !period) {
    return NextResponse.json(
      { message: 'Thiếu tham số classId, scope hoặc period.' },
      { status: 400 },
    );
  }
  const qs = new URLSearchParams({
    customerId: String(customerId),
    classId,
    scope,
    period,
  });
  if (boardKind) qs.set('boardKind', boardKind);
  if (page) qs.set('page', page);
  if (pageSize) qs.set('pageSize', pageSize);
  if (q) qs.set('q', q);
  if (filterClassId) qs.set('filterClassId', filterClassId);
  if (promptType) qs.set('promptType', promptType);
  if (modeId) qs.set('modeId', modeId);
  const res = await fetchDrillGateway(cfg, `leaderboards?${qs.toString()}`);
  return proxyGatewayJsonResponse(res);
}

/** Weak words — Mongo rollups Gateway (ADR DRG-P3). */
export async function proxyDrillWeakWordsToGateway(
  request: NextRequest,
): Promise<NextResponse> {
  const ctx = await resolveDrillGatewayContext(request, 'learning-drill-analytics-proxy');
  if (ctx instanceof NextResponse) {
    return ctx;
  }
  const { customerId, cfg } = ctx;
  const classId = request.nextUrl.searchParams.get('classId');
  if (!classId) {
    return NextResponse.json({ message: 'Thiếu tham số classId.' }, { status: 400 });
  }
  const qs = new URLSearchParams({ customerId: String(customerId), classId });
  const limit = request.nextUrl.searchParams.get('limit');
  if (limit) {
    qs.set('limit', limit);
  }
  const res = await fetchDrillGateway(cfg, `analytics/weak-words?${qs.toString()}`);
  return proxyGatewayJsonResponse(res);
}
