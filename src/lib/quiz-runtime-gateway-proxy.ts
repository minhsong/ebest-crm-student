/**
 * Quiz Runtime Gateway Proxy
 * Server-side proxy for Quiz Runtime API - routes requests to Social Gateway
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { resolveStudentCustomerIdViaCrmMe } from '@/lib/crm-student-me';
import { authorizeQuizViaCrm } from '@/lib/quiz-crm-authorize';
import {
  buildQuizAuthorizeCacheKey,
  getCachedQuizAuthorize,
  setCachedQuizAuthorize,
} from '@/lib/quiz-bff-authorize-cache';

// ============================================================================
// Types & Interfaces
// ============================================================================

interface GatewayConfig {
  baseUrl: string;
  serviceToken: string;
}

interface RouteContext {
  customerId: number;
  baseUrl: string;
  headers: Record<string, string>;
  serviceAuth: Record<string, string>;
  method: string;
  search: string;
}

type RouteHandler = (context: RouteContext, segments: string[]) => Promise<NextResponse> | null;

interface RouteKey {
  method: string;
  pattern: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

function getGatewayConfig(): GatewayConfig | null {
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

async function proxyResponse(upstream: Response): Promise<NextResponse> {
  const data = await upstream.json().catch(() => ({}));
  return NextResponse.json(data, { status: upstream.status });
}

function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  return request.json().catch(() => null);
}

// ============================================================================
// Route Handler Functions
// ============================================================================

/**
 * GET /forms - Catalog disabled (canonical §6.1)
 */
async function handleGetForms(): Promise<NextResponse> {
  return NextResponse.json(
    {
      message:
        'Danh mục đề công khai đã tắt. Dùng Bài tập hoặc menu Ôn luyện.',
    },
    { status: 403 },
  );
}

/**
 * GET /forms/:id - Get form by UUID
 */
function gatewayQueryWithCustomerId(ctx: RouteContext): string {
  const sp = new URLSearchParams(ctx.search.replace(/^\?/, ''));
  if (!sp.has('customerId')) sp.set('customerId', String(ctx.customerId));
  const q = sp.toString();
  return q ? `?${q}` : `?customerId=${ctx.customerId}`;
}

async function handleGetFormById(ctx: RouteContext, segments: string[]): Promise<NextResponse> {
  const formId = segments[1];
  const res = await fetch(
    internalStudentUrl(ctx.baseUrl, `forms/${formId}${gatewayQueryWithCustomerId(ctx)}`),
    {
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      cache: 'no-store',
    },
  );
  return proxyResponse(res);
}

/**
 * GET /forms/:id/result-layout - Get form result layout
 */
async function handleGetResultLayout(ctx: RouteContext, segments: string[]): Promise<NextResponse> {
  const formId = segments[1];
  const res = await fetch(
    internalStudentUrl(ctx.baseUrl, `forms/${formId}/result-layout${ctx.search}`),
    {
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      cache: 'no-store',
    },
  );
  return proxyResponse(res);
}

/**
 * GET /forms/:id/active-attempt - Get student's active attempt
 */
async function handleGetActiveAttempt(ctx: RouteContext, segments: string[]): Promise<NextResponse> {
  const formId = segments[1];
  const res = await fetch(
    internalStudentUrl(ctx.baseUrl, `forms/${formId}/active-attempt?customerId=${ctx.customerId}`),
    {
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      cache: 'no-store',
    },
  );
  return proxyResponse(res);
}

/**
 * GET /forms/:id/attempts - Get student's attempt history
 */
async function handleGetAttempts(ctx: RouteContext, segments: string[]): Promise<NextResponse> {
  const formId = segments[1];
  const res = await fetch(
    internalStudentUrl(ctx.baseUrl, `forms/${formId}/attempts?customerId=${ctx.customerId}`),
    {
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      cache: 'no-store',
    },
  );
  return proxyResponse(res);
}

/**
 * POST /forms/:id/attempts - Start new attempt
 */
async function handleCreateAttempt(
  ctx: RouteContext,
  segments: string[],
  request: NextRequest,
): Promise<NextResponse> {
  const formId = segments[1];
  const deny = await assertQuizAuthorizedForForm(request, formId, ctx.customerId);
  if (deny) return deny;

  const body = await parseJsonBody<{ participantSnapshot?: Record<string, unknown> }>(request);
  const sp = request.nextUrl.searchParams;
  const assignmentRaw = sp.get('assignmentId');
  const modeRaw = sp.get('mode');
  const assignmentId =
    assignmentRaw && /^\d+$/.test(assignmentRaw)
      ? Number(assignmentRaw)
      : undefined;
  const mode =
    modeRaw === 'practice' || modeRaw === 'assignment' ? modeRaw : undefined;

  const auth = await authorizeQuizViaCrm(request, {
    formPublicId: formId,
    assignmentId,
    mode: assignmentId != null ? undefined : mode,
    intent: 'start',
  });
  if (auth === null) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  if (!auth.allowed) {
    return NextResponse.json(
      { message: auth.reason ?? 'Không được phép làm bài.' },
      { status: 403 },
    );
  }

  const requestBody: {
    customerId: number;
    participantSnapshot?: Record<string, unknown>;
    portalAuthorizeToken?: string;
  } = {
    customerId: ctx.customerId,
  };
  if (body?.participantSnapshot) {
    requestBody.participantSnapshot = body.participantSnapshot;
  }
  if (auth.portalAuthorizeToken) {
    requestBody.portalAuthorizeToken = auth.portalAuthorizeToken;
  }

  const res = await fetch(internalStudentUrl(ctx.baseUrl, `forms/${formId}/attempts`), {
    method: 'POST',
    headers: { ...ctx.headers, ...ctx.serviceAuth },
    body: JSON.stringify(requestBody),
  });
  return proxyResponse(res);
}

/**
 * GET /forms/progress - Get student's overall progress
 */
async function handleGetFormsProgress(ctx: RouteContext): Promise<NextResponse> {
  const sp = new URLSearchParams(ctx.search.replace(/^\?/, ''));
  if (!sp.has('customerId')) sp.set('customerId', String(ctx.customerId));
  const qInner = `?${sp.toString()}`;

  const res = await fetch(internalStudentUrl(ctx.baseUrl, `forms/progress${qInner}`), {
    headers: { ...ctx.headers, ...ctx.serviceAuth },
    cache: 'no-store',
  });
  return proxyResponse(res);
}

/**
 * GET /progress - Get overall progress (non-form specific)
 */
async function handleGetProgress(ctx: RouteContext): Promise<NextResponse> {
  const sp = new URLSearchParams(ctx.search.replace(/^\?/, ''));
  sp.set('customerId', String(ctx.customerId));
  const qInner = `?${sp.toString()}`;

  const res = await fetch(internalStudentUrl(ctx.baseUrl, `progress${qInner}`), {
    headers: { ...ctx.headers, ...ctx.serviceAuth },
    cache: 'no-store',
  });
  return proxyResponse(res);
}

/**
 * GET /forms/:id/attempts/active - Check for active attempt (alternative endpoint)
 */
async function handleGetAttemptsActive(ctx: RouteContext, segments: string[]): Promise<NextResponse> {
  const formId = segments[1];
  const sp = new URLSearchParams(ctx.search.replace(/^\?/, ''));
  if (!sp.has('customerId')) sp.set('customerId', String(ctx.customerId));
  const qInner = `?${sp.toString()}`;

  const res = await fetch(
    internalStudentUrl(ctx.baseUrl, `forms/${formId}/attempts/active${qInner}`),
    {
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      cache: 'no-store',
    },
  );
  return proxyResponse(res);
}

/**
 * GET /attempts/:id - Get attempt by UUID
 */
async function handleGetAttemptReviewBundle(
  ctx: RouteContext,
  segments: string[],
): Promise<NextResponse> {
  const attemptId = segments[1];
  const res = await fetch(
    internalStudentUrl(
      ctx.baseUrl,
      `attempts/${attemptId}/review-bundle${gatewayQueryWithCustomerId(ctx)}`,
    ),
    {
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      cache: 'no-store',
    },
  );
  return proxyResponse(res);
}

async function handleGetAssignmentQuizStats(
  ctx: RouteContext,
  segments: string[],
): Promise<NextResponse> {
  const formId = segments[1];
  const res = await fetch(
    internalStudentUrl(
      ctx.baseUrl,
      `forms/${formId}/assignment-quiz-stats${gatewayQueryWithCustomerId(ctx)}`,
    ),
    {
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      cache: 'no-store',
    },
  );
  return proxyResponse(res);
}

async function handleGetPracticeQuizStats(
  ctx: RouteContext,
  segments: string[],
): Promise<NextResponse> {
  const formId = segments[1];
  const res = await fetch(
    internalStudentUrl(
      ctx.baseUrl,
      `forms/${formId}/practice-quiz-stats${gatewayQueryWithCustomerId(ctx)}`,
    ),
    {
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      cache: 'no-store',
    },
  );
  return proxyResponse(res);
}

async function handleGetAttemptById(ctx: RouteContext, segments: string[]): Promise<NextResponse> {
  const attemptId = segments[1];
  const qInner = gatewayQueryWithCustomerId(ctx);

  const res = await fetch(internalStudentUrl(ctx.baseUrl, `attempts/${attemptId}${qInner}`), {
    headers: { ...ctx.headers, ...ctx.serviceAuth },
    cache: 'no-store',
  });
  return proxyResponse(res);
}

/**
 * PATCH /attempts/:id/answers - Update answers
 */
async function handlePatchAnswers(
  ctx: RouteContext,
  segments: string[],
  request: NextRequest,
): Promise<NextResponse> {
  const attemptId = segments[1];
  const body = await parseJsonBody<{ answersByFormItemId?: Record<string, unknown> }>(request);

  const res = await fetch(internalStudentUrl(ctx.baseUrl, `attempts/${attemptId}/answers`), {
    method: 'PATCH',
    headers: { ...ctx.headers, ...ctx.serviceAuth },
    body: JSON.stringify({
      customerId: ctx.customerId,
      answersByFormItemId: body?.answersByFormItemId ?? {},
    }),
  });
  return proxyResponse(res);
}

/**
 * POST /attempts/:id/listening-cycle - Report listening cycle played
 */
async function handleListeningCycle(
  ctx: RouteContext,
  segments: string[],
  request: NextRequest,
): Promise<NextResponse> {
  const attemptId = segments[1];
  const body = await parseJsonBody<{ formItemId?: string }>(request);

  const res = await fetch(
    internalStudentUrl(ctx.baseUrl, `attempts/${attemptId}/listening-cycle`),
    {
      method: 'POST',
      headers: { ...ctx.headers, ...ctx.serviceAuth },
      body: JSON.stringify({
        customerId: ctx.customerId,
        formItemId: body?.formItemId ?? '',
      }),
    },
  );
  return proxyResponse(res);
}

/**
 * POST /attempts/:id/submit - Submit attempt
 */
async function handleSubmitAttempt(ctx: RouteContext, segments: string[]): Promise<NextResponse> {
  const attemptId = segments[1];
  const res = await fetch(internalStudentUrl(ctx.baseUrl, `attempts/${attemptId}/submit`), {
    method: 'POST',
    headers: { ...ctx.headers, ...ctx.serviceAuth },
    body: JSON.stringify({ customerId: ctx.customerId }),
  });
  return proxyResponse(res);
}

// ============================================================================
// Route Map
// ============================================================================

interface RouteDefinition {
  method: string;
  pattern: string;
  /** Pattern segments (`uuid` = dynamic UUID). */
  segments: string[];
  handler: (ctx: RouteContext, segments: string[], request: NextRequest) => Promise<NextResponse>;
}

function buildRouteKey(method: string, segments: string[]): string {
  return `${method}:${segments.join(':')}`;
}

function createRouteMap(): Map<string, RouteDefinition> {
  const routes = new Map<string, RouteDefinition>();

  // GET /forms
  routes.set(buildRouteKey('GET', ['forms']), {
    method: 'GET',
    pattern: '/forms',
    segments: ['forms'],
    handler: async () => handleGetForms(),
  });

  // GET /forms/progress
  routes.set(buildRouteKey('GET', ['forms', 'progress']), {
    method: 'GET',
    pattern: '/forms/progress',
    segments: ['forms', 'progress'],
    handler: async (ctx) => handleGetFormsProgress(ctx),
  });

  // GET /forms/:uuid
  routes.set(buildRouteKey('GET', ['forms', 'uuid']), {
    method: 'GET',
    pattern: '/forms/:uuid',
    segments: ['forms', 'uuid'],
    handler: async (ctx, segs) => handleGetFormById(ctx, segs),
  });

  // GET /forms/:uuid/result-layout
  routes.set(buildRouteKey('GET', ['forms', 'uuid', 'result-layout']), {
    method: 'GET',
    pattern: '/forms/:uuid/result-layout',
    segments: ['forms', 'uuid', 'result-layout'],
    handler: async (ctx, segs) => handleGetResultLayout(ctx, segs),
  });

  // GET /forms/:uuid/active-attempt
  routes.set(buildRouteKey('GET', ['forms', 'uuid', 'active-attempt']), {
    method: 'GET',
    pattern: '/forms/:uuid/active-attempt',
    segments: ['forms', 'uuid', 'active-attempt'],
    handler: async (ctx, segs) => handleGetActiveAttempt(ctx, segs),
  });

  // GET /forms/:uuid/attempts
  routes.set(buildRouteKey('GET', ['forms', 'uuid', 'attempts']), {
    method: 'GET',
    pattern: '/forms/:uuid/attempts',
    segments: ['forms', 'uuid', 'attempts'],
    handler: async (ctx, segs) => handleGetAttempts(ctx, segs),
  });

  // POST /forms/:uuid/attempts
  routes.set(buildRouteKey('POST', ['forms', 'uuid', 'attempts']), {
    method: 'POST',
    pattern: '/forms/:uuid/attempts',
    segments: ['forms', 'uuid', 'attempts'],
    handler: async (ctx, segs, req) => handleCreateAttempt(ctx, segs, req),
  });

  // GET /forms/:uuid/attempts/active
  routes.set(buildRouteKey('GET', ['forms', 'uuid', 'attempts', 'active']), {
    method: 'GET',
    pattern: '/forms/:uuid/attempts/active',
    segments: ['forms', 'uuid', 'attempts', 'active'],
    handler: async (ctx, segs) => handleGetAttemptsActive(ctx, segs),
  });

  // GET /progress
  routes.set(buildRouteKey('GET', ['progress']), {
    method: 'GET',
    pattern: '/progress',
    segments: ['progress'],
    handler: async (ctx) => handleGetProgress(ctx),
  });

  // GET /attempts/:uuid
  routes.set(buildRouteKey('GET', ['attempts', 'uuid']), {
    method: 'GET',
    pattern: '/attempts/:uuid',
    segments: ['attempts', 'uuid'],
    handler: async (ctx, segs) => handleGetAttemptById(ctx, segs),
  });

  routes.set(buildRouteKey('GET', ['attempts', 'uuid', 'review-bundle']), {
    method: 'GET',
    pattern: '/attempts/:uuid/review-bundle',
    segments: ['attempts', 'uuid', 'review-bundle'],
    handler: async (ctx, segs) => handleGetAttemptReviewBundle(ctx, segs),
  });

  routes.set(buildRouteKey('GET', ['forms', 'uuid', 'assignment-quiz-stats']), {
    method: 'GET',
    pattern: '/forms/:uuid/assignment-quiz-stats',
    segments: ['forms', 'uuid', 'assignment-quiz-stats'],
    handler: async (ctx, segs) => handleGetAssignmentQuizStats(ctx, segs),
  });

  routes.set(buildRouteKey('GET', ['forms', 'uuid', 'practice-quiz-stats']), {
    method: 'GET',
    pattern: '/forms/:uuid/practice-quiz-stats',
    segments: ['forms', 'uuid', 'practice-quiz-stats'],
    handler: async (ctx, segs) => handleGetPracticeQuizStats(ctx, segs),
  });

  // PATCH /attempts/:uuid/answers
  routes.set(buildRouteKey('PATCH', ['attempts', 'uuid', 'answers']), {
    method: 'PATCH',
    pattern: '/attempts/:uuid/answers',
    segments: ['attempts', 'uuid', 'answers'],
    handler: async (ctx, segs, req) => handlePatchAnswers(ctx, segs, req),
  });

  // POST /attempts/:uuid/listening-cycle
  routes.set(buildRouteKey('POST', ['attempts', 'uuid', 'listening-cycle']), {
    method: 'POST',
    pattern: '/attempts/:uuid/listening-cycle',
    segments: ['attempts', 'uuid', 'listening-cycle'],
    handler: async (ctx, segs, req) => handleListeningCycle(ctx, segs, req),
  });

  // POST /attempts/:uuid/submit
  routes.set(buildRouteKey('POST', ['attempts', 'uuid', 'submit']), {
    method: 'POST',
    pattern: '/attempts/:uuid/submit',
    segments: ['attempts', 'uuid', 'submit'],
    handler: async (ctx, segs) => handleSubmitAttempt(ctx, segs),
  });

  return routes;
}

/**
 * Match route from segments
 * Supports UUID wildcards
 */
function matchRoute(
  routeMap: Map<string, RouteDefinition>,
  method: string,
  segments: string[],
): RouteDefinition | null {
  // Exact match first
  const exactKey = buildRouteKey(method, segments);
  const exact = routeMap.get(exactKey);
  if (exact) return exact;

  // Pattern matching with UUID support
  for (const [key, route] of routeMap) {
    if (route.method !== method) continue;
    if (route.segments.length !== segments.length) continue;

    let matches = true;
    for (let i = 0; i < segments.length; i++) {
      const pattern = route.segments[i];
      const segment = segments[i];

      if (pattern === 'uuid') {
        if (!isUuid(segment)) {
          matches = false;
          break;
        }
      } else if (pattern !== segment) {
        matches = false;
        break;
      }
    }

    if (matches) return route;
  }

  return null;
}

// ============================================================================
// Main Export
// ============================================================================

const ROUTE_MAP = createRouteMap();

function formPublicIdFromSegments(segments: string[]): string | null {
  if (segments[0] !== 'forms' || segments.length < 2) return null;
  const id = segments[1];
  if (id === 'progress' || !isUuid(id)) return null;
  return id;
}

async function assertQuizAuthorizedForForm(
  request: NextRequest,
  formPublicId: string,
  customerId: number,
): Promise<NextResponse | null> {
  const sp = request.nextUrl.searchParams;
  const assignmentRaw = sp.get('assignmentId');
  const modeRaw = sp.get('mode');
  const assignmentId =
    assignmentRaw && /^\d+$/.test(assignmentRaw)
      ? Number(assignmentRaw)
      : undefined;
  const mode =
    modeRaw === 'practice' || modeRaw === 'assignment' ? modeRaw : undefined;

  const cacheKey = buildQuizAuthorizeCacheKey(
    customerId,
    formPublicId,
    assignmentId,
    assignmentId != null ? undefined : mode,
  );
  let result = getCachedQuizAuthorize(cacheKey);
  if (!result) {
    const fetched = await authorizeQuizViaCrm(request, {
      formPublicId,
      assignmentId,
      mode: assignmentId != null ? undefined : mode,
      intent: 'access',
    });
    if (fetched) {
      setCachedQuizAuthorize(cacheKey, fetched);
      result = fetched;
    }
  }

  if (result === null) {
    return NextResponse.json({ message: 'Chưa đăng nhập.' }, { status: 401 });
  }
  if (!result.allowed) {
    return NextResponse.json(
      { message: result.reason ?? 'Không được phép làm bài.' },
      { status: 403 },
    );
  }
  return null;
}

/**
 * Quiz runtime: Portal server → Social Gateway (không qua CRM).
 * Đọc `customerId` từ JWT học viên; gateway internal/student tin CRM service Bearer.
 */
export async function proxyQuizRuntimeToGateway(
  request: NextRequest,
  segments: string[],
): Promise<NextResponse> {
  // Validate gateway configuration
  const cfg = getGatewayConfig();
  if (!cfg) {
    return NextResponse.json(
      {
        message:
          'Quiz gateway chưa cấu hình. Đặt SOCIAL_GATEWAY_BASE_URL và SOCIAL_GATEWAY_SERVICE_TOKEN trên server Portal.',
      },
      { status: 500 },
    );
  }

  // Authenticate student
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

  // Build route context
  const ctx: RouteContext = {
    customerId,
    baseUrl: cfg.baseUrl,
    headers: {
      Accept: 'application/json',
    },
    serviceAuth: {
      Authorization: `Bearer ${cfg.serviceToken}`,
      'Content-Type': 'application/json',
    },
    method: request.method,
    search: request.nextUrl.search ?? '',
  };

  const isReviewBundle =
    segments[0] === 'attempts' &&
    segments.length === 3 &&
    segments[2] === 'review-bundle';

  const formPublicId = formPublicIdFromSegments(segments);
  if (formPublicId && !isReviewBundle) {
    const deny = await assertQuizAuthorizedForForm(request, formPublicId, customerId);
    if (deny) return deny;
  }

  // Find matching route
  const route = matchRoute(ROUTE_MAP, request.method, segments);
  if (!route) {
    return NextResponse.json(
      { message: 'Unsupported quiz-runtime path or method.' },
      { status: 404 },
    );
  }

  // Execute route handler
  return route.handler(ctx, segments, request);
}

// Export individual handlers for testing
export {
  handleGetForms,
  handleGetFormById,
  handleGetResultLayout,
  handleGetActiveAttempt,
  handleGetAttempts,
  handleCreateAttempt,
  handleGetFormsProgress,
  handleGetProgress,
  handleGetAttemptsActive,
  handleGetAttemptById,
  handlePatchAnswers,
  handleListeningCycle,
  handleSubmitAttempt,
};
