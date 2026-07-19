import type { QuizAttemptStateResponse } from '@/features/quiz-test/types';
import { getHistoryAssignmentId } from '@/features/quiz-test/lib/quiz-attempt-history';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import {
  quizRuntimePublicUrl,
  type QuizRuntimeVariant,
} from '@/features/quiz-test/quiz-gateway-browser';
import {
  dedupeInflight,
  setTtlCache,
  type TtlCacheEntry,
} from '@/lib/crm-inflight-cache';
import { setQuizFormContext } from '@/lib/quiz-form-context';
import {
  buildQuizAccessCacheKey,
  setCachedQuizRuntimeAccess,
} from '@/lib/quiz-runtime-access-cache';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access.types';

const ACTIVE_ATTEMPT_TTL_MS = 15_000;
const inflight = new Map<string, Promise<QuizAttemptStateResponse | null>>();
const ttlCache = new Map<string, TtlCacheEntry<QuizAttemptStateResponse | null>>();

function activeAttemptCacheKey(
  formPublicId: string,
  options?: { mockTestOnlineRuntime?: boolean },
): string {
  const fid = formPublicId.trim();
  const channel = options?.mockTestOnlineRuntime ? 'mto' : 'default';
  return `${channel}:${fid}`;
}

function getCachedActiveAttempt(
  cacheKey: string,
): QuizAttemptStateResponse | null | undefined {
  const hit = ttlCache.get(cacheKey);
  if (!hit) return undefined;
  if (hit.expiresAt <= Date.now()) {
    ttlCache.delete(cacheKey);
    return undefined;
  }
  return hit.value;
}

export function invalidateActiveQuizAttemptCache(
  formPublicId?: string,
  options?: { mockTestOnlineRuntime?: boolean },
): void {
  if (!formPublicId) {
    inflight.clear();
    ttlCache.clear();
    return;
  }
  const fid = formPublicId.trim();
  if (!fid) return;
  if (options?.mockTestOnlineRuntime != null) {
    const key = activeAttemptCacheKey(fid, options);
    inflight.delete(key);
    ttlCache.delete(key);
    return;
  }
  // Không rõ channel — xóa cả HV và MTO để tránh stale chéo.
  for (const suffix of ['default', 'mto'] as const) {
    const key = `${suffix}:${fid}`;
    inflight.delete(key);
    ttlCache.delete(key);
  }
}

/** Dedupe + TTL — Entry peek và loadForm dùng chung một request. */
export async function fetchActiveQuizAttemptState(
  formPublicId: string,
  options?: { mockTestOnlineRuntime?: boolean },
): Promise<QuizAttemptStateResponse | null> {
  const fid = formPublicId.trim();
  if (!fid) return null;

  const runtimeVariant: QuizRuntimeVariant | null = options?.mockTestOnlineRuntime
    ? 'mock-test-online'
    : null;
  const cacheKey = activeAttemptCacheKey(fid, options);

  const cached = getCachedActiveAttempt(cacheKey);
  if (cached !== undefined) return cached;

  return dedupeInflight(inflight, cacheKey, async () => {
    const res = await fetchQuizRuntimeJson<QuizAttemptStateResponse>(
      quizRuntimePublicUrl(`forms/${fid}/active-attempt`, runtimeVariant),
    );
    const data =
      res.ok && res.data && typeof res.data === 'object'
        ? (res.data as QuizAttemptStateResponse)
        : null;
    setTtlCache(ttlCache, cacheKey, data, ACTIVE_ATTEMPT_TTL_MS);
    return data;
  });
}

export function accessFromActiveAttempt(
  attempt: Record<string, unknown>,
): QuizRuntimeAccess | null {
  const participant = attempt.participant as
    | { snapshot?: Record<string, unknown> }
    | undefined;
  const snap = participant?.snapshot;
  const maxRaw = snap?.quizMaxAttempts;
  const effectiveMaxAttempts =
    maxRaw === null || maxRaw === undefined
      ? undefined
      : Number.isFinite(Number(maxRaw))
        ? Number(maxRaw)
        : undefined;

  if (snap?.mode === 'practice') {
    return {
      mode: 'practice',
      practiceMode: true,
      effectiveMaxAttempts,
    };
  }

  const assignmentId = getHistoryAssignmentId(attempt);
  if (assignmentId != null && assignmentId >= 1) {
    return {
      mode: 'assignment',
      assignmentId,
      practiceMode: false,
      effectiveMaxAttempts,
    };
  }

  return null;
}

export function persistResumeAccessContext(
  formPublicId: string,
  access: QuizRuntimeAccess,
): void {
  if (access.mode === 'assignment' && access.assignmentId != null) {
    setQuizFormContext(formPublicId, {
      mode: 'assignment',
      assignmentId: access.assignmentId,
      quizMaxAttempts: access.effectiveMaxAttempts,
    });
    setCachedQuizRuntimeAccess(
      buildQuizAccessCacheKey(formPublicId, {
        assignmentIdHint: access.assignmentId,
        intent: 'access',
      }),
      access,
    );
  } else if (access.practiceMode) {
    setQuizFormContext(formPublicId, { mode: 'practice' });
  }
}

export type ActiveQuizResumePeek = {
  inProgress: boolean;
  state: QuizAttemptStateResponse | null;
  access: QuizRuntimeAccess | null;
  attemptPublicId?: string;
};

export async function peekActiveQuizResumeAccess(
  formPublicId: string,
): Promise<ActiveQuizResumePeek> {
  const state = await fetchActiveQuizAttemptState(formPublicId);
  if (!state || state.state !== 'in_progress' || !state.attempt) {
    return { inProgress: false, state, access: null };
  }

  const rawAttempt = state.attempt as Record<string, unknown>;
  const access = accessFromActiveAttempt(rawAttempt);
  const attemptPublicId =
    typeof rawAttempt.attemptPublicId === 'string'
      ? rawAttempt.attemptPublicId
      : undefined;

  if (access) {
    persistResumeAccessContext(formPublicId, access);
  }

  return {
    inProgress: true,
    state,
    access,
    attemptPublicId,
  };
}
