import type { QuizAuthorizeResponse } from '@/lib/quiz-crm-authorize';

type CacheEntry = {
  result: QuizAuthorizeResponse;
  expiresAt: number;
};

const TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

export function buildQuizAuthorizeCacheKey(
  customerId: number,
  formPublicId: string,
  assignmentId?: number,
  mode?: string,
): string {
  return `${customerId}|${formPublicId.trim()}|${assignmentId ?? ''}|${mode ?? ''}`;
}

export function getCachedQuizAuthorize(key: string): QuizAuthorizeResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.result;
}

export function setCachedQuizAuthorize(
  key: string,
  result: QuizAuthorizeResponse,
): void {
  cache.set(key, { result, expiresAt: Date.now() + TTL_MS });
}
