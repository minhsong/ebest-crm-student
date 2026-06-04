import { getHistoryAssignmentId } from '@/features/quiz-test/lib/quiz-attempt-history';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import { getQuizFormContext, setQuizFormContext } from '@/lib/quiz-form-context';
import type { QuizAuthorizeResponse } from '@/lib/quiz-crm-authorize';
import {
  accessFromActiveAttempt,
  peekActiveQuizResumeAccess,
} from '@/lib/quiz-resume-access';
import {
  buildQuizAccessCacheKey,
  getCachedQuizRuntimeAccess,
  setCachedQuizRuntimeAccess,
} from '@/lib/quiz-runtime-access-cache';
import type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access.types';
import {
  buildClientQuizAuthorizeCacheKey,
  getCachedQuizAuthorize,
  resolveQuizAuthorizeCached,
} from '@/lib/quiz-bff-authorize-cache';

export type { QuizRuntimeAccess } from '@/lib/quiz-runtime-access.types';

export function quizRuntimeQueryFromAccess(access: QuizRuntimeAccess): string {
  const sp = new URLSearchParams();
  if (access.mode === 'assignment' && access.assignmentId != null && access.assignmentId >= 1) {
    sp.set('assignmentId', String(access.assignmentId));
  } else if (access.practiceMode) {
    sp.set('mode', 'practice');
  }
  const q = sp.toString();
  return q ? `?${q}` : '';
}

async function authorizeForm(
  formPublicId: string,
  intent: 'access' | 'start',
  hints?: { assignmentId?: number; mode?: 'practice' },
): Promise<QuizAuthorizeResponse | null> {
  const cacheKey = buildClientQuizAuthorizeCacheKey({
    formPublicId,
    assignmentId: hints?.assignmentId,
    mode: hints?.mode,
    intent,
  });
  const cached = getCachedQuizAuthorize(cacheKey);
  if (cached) return cached;

  return resolveQuizAuthorizeCached(cacheKey, async () => {
    const body: Record<string, unknown> = { formPublicId, intent };
    if (hints?.assignmentId != null && hints.assignmentId >= 1) {
      body.assignmentId = hints.assignmentId;
    } else if (hints?.mode === 'practice') {
      body.mode = 'practice';
    }

    const res = await fetch('/api/student/quiz/authorize', {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
    if (!res.ok) {
      return { allowed: false, reason: 'Không xác thực được quyền truy cập đề.' };
    }
    const data = (await res.json().catch(() => null)) as QuizAuthorizeResponse | null;
    if (!data || typeof data !== 'object') {
      return { allowed: false, reason: 'Phản hồi authorize không hợp lệ.' };
    }
    return data;
  });
}

function accessFromAuthorize(data: QuizAuthorizeResponse): QuizRuntimeAccess | null {
  if (!data.allowed) return null;
  const effectiveMaxAttempts =
    data.effectiveMaxAttempts === undefined
      ? undefined
      : data.effectiveMaxAttempts;
  if (data.mode === 'assignment') {
    const aid = data.context?.assignmentId;
    if (aid == null || !Number.isFinite(Number(aid))) return null;
    const assignmentId = Number(aid);
    return {
      mode: 'assignment',
      assignmentId,
      practiceMode: false,
      effectiveMaxAttempts,
    };
  }
  return { mode: 'practice', practiceMode: true, effectiveMaxAttempts };
}

function persistAccessContext(fid: string, access: QuizRuntimeAccess): void {
  if (access.mode === 'assignment' && access.assignmentId != null) {
    setQuizFormContext(fid, {
      mode: 'assignment',
      assignmentId: access.assignmentId,
      quizMaxAttempts: access.effectiveMaxAttempts,
    });
  } else {
    setQuizFormContext(fid, {
      mode: 'practice',
      quizMaxAttempts: access.effectiveMaxAttempts,
    });
  }
}

/** Access tối thiểu khi in_progress nhưng snapshot thiếu mode/assignmentId. */
function resumeAccessFallback(
  fid: string,
  rawAttempt?: Record<string, unknown>,
): QuizRuntimeAccess | null {
  if (rawAttempt) {
    const fromAttempt = accessFromActiveAttempt(rawAttempt);
    if (fromAttempt) return fromAttempt;
    const aid = getHistoryAssignmentId(rawAttempt);
    if (aid != null && aid >= 1) {
      return { mode: 'assignment', assignmentId: aid, practiceMode: false };
    }
  }
  const stored = getQuizFormContext(fid);
  if (stored?.mode === 'assignment' && stored.assignmentId != null) {
    return {
      mode: 'assignment',
      assignmentId: stored.assignmentId,
      practiceMode: false,
      effectiveMaxAttempts: stored.quizMaxAttempts,
    };
  }
  if (stored?.mode === 'practice') {
    return { mode: 'practice', practiceMode: true, effectiveMaxAttempts: stored.quizMaxAttempts };
  }
  return null;
}

/**
 * Xác định kênh truy cập runtime: bài tập (ưu tiên) hoặc ôn luyện.
 * Resume in_progress → Mongo only; còn lại → session hint → CRM authorize.
 */
export async function resolveQuizRuntimeAccess(
  formPublicId: string,
  options?: {
    attemptPublicId?: string;
    assignmentIdHint?: number;
    preferPractice?: boolean;
    intent?: 'access' | 'start';
    skipCache?: boolean;
  },
): Promise<QuizRuntimeAccess | null> {
  const fid = formPublicId.trim();
  if (!fid) return null;

  const cacheKey = buildQuizAccessCacheKey(fid, options);
  if (!options?.skipCache) {
    const cached = getCachedQuizRuntimeAccess(cacheKey);
    if (cached) return cached;
  }

  const access = await resolveQuizRuntimeAccessUncached(fid, options);
  if (access && !options?.skipCache) {
    setCachedQuizRuntimeAccess(cacheKey, access);
  }
  return access;
}

async function resolveQuizRuntimeAccessUncached(
  fid: string,
  options?: {
    attemptPublicId?: string;
    assignmentIdHint?: number;
    preferPractice?: boolean;
    intent?: 'access' | 'start';
  },
): Promise<QuizRuntimeAccess | null> {
  const intent = options?.intent ?? 'access';

  if (intent === 'access' && !options?.preferPractice) {
    const resume = await peekActiveQuizResumeAccess(fid);
    if (resume.inProgress) {
      const rawAttempt =
        resume.state?.state === 'in_progress'
          ? (resume.state.attempt as Record<string, unknown> | undefined)
          : undefined;
      return resume.access ?? resumeAccessFallback(fid, rawAttempt);
    }
  }

  const hintId =
    options?.assignmentIdHint != null && options.assignmentIdHint >= 1
      ? options.assignmentIdHint
      : null;
  if (hintId != null) {
    const auth = await authorizeForm(fid, intent, { assignmentId: hintId });
    const access = auth ? accessFromAuthorize(auth) : null;
    if (access?.mode === 'assignment') {
      persistAccessContext(fid, access);
      return access;
    }
  }

  if (!options?.preferPractice) {
    const stored = getQuizFormContext(fid);
    if (stored?.mode === 'assignment' && stored.assignmentId != null) {
      const auth = await authorizeForm(fid, intent, {
        assignmentId: stored.assignmentId,
      });
      const access = auth ? accessFromAuthorize(auth) : null;
      if (access) return access;
    }
  }

  if (options?.attemptPublicId?.trim()) {
    const attemptRes = await fetchQuizRuntimeJson<Record<string, unknown>>(
      quizRuntimePublicUrl(`attempts/${options.attemptPublicId.trim()}`),
    );
    if (attemptRes.ok && attemptRes.data) {
      const row = attemptRes.data;
      if (String(row.status ?? '').toLowerCase() === 'in_progress') {
        const access =
          accessFromActiveAttempt(row) ?? resumeAccessFallback(fid, row);
        if (access) {
          persistAccessContext(fid, access);
          return access;
        }
      }
      const aid = getHistoryAssignmentId(row);
      if (aid != null && aid >= 1) {
        const auth = await authorizeForm(fid, intent, { assignmentId: aid });
        const access = auth ? accessFromAuthorize(auth) : null;
        if (access) {
          persistAccessContext(fid, access);
          return access;
        }
      }
      const participant = row.participant as { snapshot?: Record<string, unknown> } | undefined;
      if (participant?.snapshot?.mode === 'practice') {
        const auth = await authorizeForm(fid, intent, { mode: 'practice' });
        const access = auth ? accessFromAuthorize(auth) : null;
        if (access) {
          persistAccessContext(fid, access);
          return access;
        }
      }
    }
  }

  if (options?.preferPractice) {
    const auth = await authorizeForm(fid, intent, { mode: 'practice' });
    const access = auth ? accessFromAuthorize(auth) : null;
    if (access) {
      persistAccessContext(fid, access);
      return access;
    }
  }

  const auth = await authorizeForm(fid, intent);
  const access = auth ? accessFromAuthorize(auth) : null;
  if (access) persistAccessContext(fid, access);
  return access;
}

export function pinAssignmentQuizRuntimeAccess(
  formPublicId: string,
  assignmentId: number,
  options?: { quizMaxAttempts?: number | null },
): void {
  setQuizFormContext(formPublicId, {
    mode: 'assignment',
    assignmentId,
    quizMaxAttempts: options?.quizMaxAttempts,
  });
  primeQuizRuntimeAccessCache(formPublicId, {
    mode: 'assignment',
    assignmentId,
    practiceMode: false,
    effectiveMaxAttempts: options?.quizMaxAttempts,
  });
}

export function primeQuizRuntimeAccessCache(
  formPublicId: string,
  access: QuizRuntimeAccess,
  options?: { preferPractice?: boolean },
): void {
  setCachedQuizRuntimeAccess(
    buildQuizAccessCacheKey(formPublicId, {
      preferPractice: options?.preferPractice,
      assignmentIdHint: access.assignmentId,
      intent: 'access',
    }),
    access,
  );
}
