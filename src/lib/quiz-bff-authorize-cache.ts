import { dedupeInflight } from '@/lib/crm-inflight-cache';
import type { QuizAuthorizeResponse } from '@/lib/quiz-crm-authorize';

type CacheEntry = {
  result: QuizAuthorizeResponse;
  expiresAt: number;
};

const TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();
const authorizeInflight = new Map<string, Promise<QuizAuthorizeResponse | null>>();

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

/** Cache + dedupe authorize song song (reload quiz gọi nhiều proxy Gateway cùng lúc). */
export async function resolveQuizAuthorizeCached(
  key: string,
  fetcher: () => Promise<QuizAuthorizeResponse | null>,
): Promise<QuizAuthorizeResponse | null> {
  const hit = getCachedQuizAuthorize(key);
  if (hit) return hit;

  return dedupeInflight(authorizeInflight, key, async () => {
    const result = await fetcher();
    if (result) setCachedQuizAuthorize(key, result);
    return result;
  });
}

export function buildClientQuizAuthorizeCacheKey(params: {
  formPublicId: string;
  assignmentId?: number;
  mode?: string;
  intent?: string;
}): string {
  return `client|${params.formPublicId.trim()}|${params.assignmentId ?? ''}|${params.mode ?? ''}|${params.intent ?? 'access'}`;
}
