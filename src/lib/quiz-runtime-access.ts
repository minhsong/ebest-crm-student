import { getHistoryAssignmentId } from '@/features/quiz-test/lib/quiz-attempt-history';
import { fetchQuizRuntimeJson } from '@/features/quiz-test/lib/quiz-runtime-http';
import { quizRuntimePublicUrl } from '@/features/quiz-test/quiz-gateway-browser';
import { getQuizFormContext, setQuizFormContext } from '@/lib/quiz-form-context';
import type { QuizAuthorizeResponse } from '@/lib/quiz-crm-authorize';
import {
  buildQuizAccessCacheKey,
  getCachedQuizRuntimeAccess,
  setCachedQuizRuntimeAccess,
} from '@/lib/quiz-runtime-access-cache';

export type QuizRuntimeAccess = {
  mode: 'assignment' | 'practice';
  assignmentId?: number;
  practiceMode: boolean;
};

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
  if (!res.ok) return { allowed: false, reason: 'Không xác thực được quyền truy cập đề.' };
  const data = (await res.json().catch(() => null)) as QuizAuthorizeResponse | null;
  if (!data || typeof data !== 'object') {
    return { allowed: false, reason: 'Phản hồi authorize không hợp lệ.' };
  }
  return data;
}

function accessFromAuthorize(data: QuizAuthorizeResponse): QuizRuntimeAccess | null {
  if (!data.allowed) return null;
  if (data.mode === 'assignment') {
    const aid = data.context?.assignmentId;
    if (aid == null || !Number.isFinite(Number(aid))) return null;
    const assignmentId = Number(aid);
    return { mode: 'assignment', assignmentId, practiceMode: false };
  }
  return { mode: 'practice', practiceMode: true };
}

/**
 * Xác định kênh truy cập runtime: bài tập (ưu tiên) hoặc ôn luyện.
 * Thứ tự: snapshot attempt → session → CRM auto-resolve.
 */
export async function resolveQuizRuntimeAccess(
  formPublicId: string,
  options?: {
    attemptPublicId?: string;
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
    preferPractice?: boolean;
    intent?: 'access' | 'start';
  },
): Promise<QuizRuntimeAccess | null> {
  const intent = options?.intent ?? 'access';

  if (options?.attemptPublicId?.trim()) {
    const attemptRes = await fetchQuizRuntimeJson<Record<string, unknown>>(
      quizRuntimePublicUrl(`attempts/${options.attemptPublicId.trim()}`),
    );
    if (attemptRes.ok && attemptRes.data) {
      const aid = getHistoryAssignmentId(attemptRes.data);
      const participant = attemptRes.data.participant as { snapshot?: Record<string, unknown> } | undefined;
      const snap = participant?.snapshot;
      if (snap?.mode === 'practice') {
        const auth = await authorizeForm(fid, intent, { mode: 'practice' });
        const access = auth ? accessFromAuthorize(auth) : null;
        if (access) {
          setQuizFormContext(fid, { mode: 'practice' });
          return access;
        }
      }
      if (aid != null && aid >= 1) {
        const auth = await authorizeForm(fid, intent, { assignmentId: aid });
        const access = auth ? accessFromAuthorize(auth) : null;
        if (access) {
          setQuizFormContext(fid, { mode: 'assignment', assignmentId: aid });
          return access;
        }
      }
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

  if (options?.preferPractice) {
    const auth = await authorizeForm(fid, intent, { mode: 'practice' });
    const access = auth ? accessFromAuthorize(auth) : null;
    if (access) {
      setQuizFormContext(fid, { mode: 'practice' });
      return access;
    }
  }

  const auth = await authorizeForm(fid, intent);
  const access = auth ? accessFromAuthorize(auth) : null;
  if (access) {
    if (access.mode === 'assignment' && access.assignmentId != null) {
      setQuizFormContext(fid, {
        mode: 'assignment',
        assignmentId: access.assignmentId,
      });
    } else {
      setQuizFormContext(fid, { mode: 'practice' });
    }
  }
  return access;
}

/** Gắn session + cache access assignment (nút Làm bài / Xem kết quả). */
export function pinAssignmentQuizRuntimeAccess(
  formPublicId: string,
  assignmentId: number,
): void {
  setQuizFormContext(formPublicId, { mode: 'assignment', assignmentId });
  primeQuizRuntimeAccessCache(formPublicId, {
    mode: 'assignment',
    assignmentId,
    practiceMode: false,
  });
}

/** Sau khi pin assignment từ UI — giảm authorize trùng trong phiên. */
export function primeQuizRuntimeAccessCache(
  formPublicId: string,
  access: QuizRuntimeAccess,
  options?: { preferPractice?: boolean },
): void {
  setCachedQuizRuntimeAccess(
    buildQuizAccessCacheKey(formPublicId, {
      preferPractice: options?.preferPractice,
      intent: 'access',
    }),
    access,
  );
}
