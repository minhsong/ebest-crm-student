/**
 * Quiz runtime: browser → `/api/quiz-runtime/*` → CRM `GET /api/v1/student/me` (cùng endpoint profile, có cache Redis)
 * → server Portal gọi Social Gateway (public + internal/student). IdP duy nhất là CRM — không verify JWT trên Portal.
 * Redis autosave/WS: phía gateway (spec runtime).
 */
const QUIZ_RUNTIME_PROXY_PREFIX = '/api/quiz-runtime';
const MOCK_TEST_ONLINE_QUIZ_RUNTIME_PREFIX =
  '/api/public/mock-test-online/quiz-runtime';

/** @deprecated Dùng prop `mockTestOnlineRuntime` trên QuizAttemptClient. */
let legacyActiveQuizRuntimePrefix: string | null = null;

/** @deprecated Dùng prop `mockTestOnlineRuntime` trên QuizAttemptClient. */
export function setMockTestOnlineQuizRuntimePrefix(enabled: boolean): void {
  legacyActiveQuizRuntimePrefix = enabled
    ? MOCK_TEST_ONLINE_QUIZ_RUNTIME_PREFIX
    : null;
}

export type QuizRuntimeVariant = 'default' | 'mock-test-online';

export function resolveQuizRuntimePrefix(
  variant?: QuizRuntimeVariant | null,
): string {
  if (variant === 'mock-test-online') return MOCK_TEST_ONLINE_QUIZ_RUNTIME_PREFIX;
  if (variant === 'default') return QUIZ_RUNTIME_PROXY_PREFIX;
  return legacyActiveQuizRuntimePrefix ?? QUIZ_RUNTIME_PROXY_PREFIX;
}

export function isMockTestOnlineQuizRuntimeActive(
  variant?: QuizRuntimeVariant | null,
): boolean {
  if (variant === 'mock-test-online') return true;
  if (variant === 'default') return false;
  return legacyActiveQuizRuntimePrefix === MOCK_TEST_ONLINE_QUIZ_RUNTIME_PREFIX;
}

export function quizRuntimePublicUrl(
  segment: string,
  variant?: QuizRuntimeVariant | null,
): string {
  const path = segment.replace(/^\//, '');
  return `${resolveQuizRuntimePrefix(variant)}/${path}`;
}

/**
 * Origin HTTP(S) của Social Gateway — browser Socket.IO không đi qua `/api/quiz-runtime`.
 * Ví dụ `http://127.0.0.1:3040`. Phải cho phép CORS/handshake trên gateway (`WS_CORS_ORIGIN`).
 */
export function getQuizGatewayWsOrigin(): string {
  const raw =
    typeof process.env.NEXT_PUBLIC_SOCIAL_GATEWAY_WS_ORIGIN === 'string'
      ? process.env.NEXT_PUBLIC_SOCIAL_GATEWAY_WS_ORIGIN.trim().replace(/\/$/, '')
      : '';
  return raw;
}

/** Khớp `WS_PATH` trên gateway (mặc định `/socket.io`). */
export function getQuizGatewaySocketIoPath(): string {
  const p =
    typeof process.env.NEXT_PUBLIC_SOCIAL_GATEWAY_WS_PATH === 'string'
      ? process.env.NEXT_PUBLIC_SOCIAL_GATEWAY_WS_PATH.trim()
      : '';
  if (!p) return '/socket.io';
  return p.startsWith('/') ? p : `/${p}`;
}

/** @deprecated Luôn dùng proxy HTTP — giữ cho tương thích gọi `Boolean(getQuizGatewayBaseUrl())`. */
export function getQuizGatewayBaseUrl(): string {
  return '/';
}
