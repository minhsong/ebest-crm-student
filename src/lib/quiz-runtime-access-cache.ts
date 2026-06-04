import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access.types';

type CacheEntry = {
  access: QuizRuntimeAccess;
  expiresAt: number;
};

const ACCESS_CACHE_TTL_MS = 60_000;
const accessCache = new Map<string, CacheEntry>();

export function buildQuizAccessCacheKey(
  formPublicId: string,
  options?: {
    attemptPublicId?: string;
    preferPractice?: boolean;
    assignmentIdHint?: number;
    intent?: 'access' | 'start';
  },
): string {
  const fid = formPublicId.trim();
  const attempt = (options?.attemptPublicId ?? '').trim();
  const practice = options?.preferPractice ? '1' : '0';
  const hint =
    options?.assignmentIdHint != null && options.assignmentIdHint >= 1
      ? String(options.assignmentIdHint)
      : '';
  const intent = options?.intent ?? 'access';
  return `${fid}|${attempt}|${practice}|${hint}|${intent}`;
}

export function getCachedQuizRuntimeAccess(
  cacheKey: string,
): QuizRuntimeAccess | null {
  const hit = accessCache.get(cacheKey);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    accessCache.delete(cacheKey);
    return null;
  }
  return hit.access;
}

export function setCachedQuizRuntimeAccess(
  cacheKey: string,
  access: QuizRuntimeAccess,
): void {
  accessCache.set(cacheKey, {
    access,
    expiresAt: Date.now() + ACCESS_CACHE_TTL_MS,
  });
}

export function clearQuizRuntimeAccessCache(formPublicId?: string): void {
  if (!formPublicId) {
    accessCache.clear();
    return;
  }
  const prefix = `${formPublicId.trim()}|`;
  for (const key of accessCache.keys()) {
    if (key.startsWith(prefix)) accessCache.delete(key);
  }
}
