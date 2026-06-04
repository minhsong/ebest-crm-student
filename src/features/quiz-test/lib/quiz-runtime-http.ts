import {
  sanitizeStudentFacingMessage,
  studentMessageForHttpStatus,
  STUDENT_SAFE_USER_MESSAGES,
} from '@/lib/student-safe-errors';

export async function fetchQuizRuntimeJson<T>(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: T }> {
  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = (await res.json().catch(() => ({}))) as T;
  return { ok: res.ok, status: res.status, data };
}

/** Lấy message hiển thị từ body API quiz — không hiện HTTP status / chi tiết server. */
export function quizRuntimeErrorMessage(
  status: number,
  data: unknown,
  context: 'load' | 'submit' | 'start' | 'generic' = 'generic',
): string {
  const contextFallback =
    context === 'load'
      ? STUDENT_SAFE_USER_MESSAGES.quizLoadFailed
      : context === 'submit'
        ? STUDENT_SAFE_USER_MESSAGES.quizSubmitFailed
        : context === 'start'
          ? STUDENT_SAFE_USER_MESSAGES.quizLoadFailed
          : STUDENT_SAFE_USER_MESSAGES.quizUnavailable;
  const statusFallback = studentMessageForHttpStatus(status);
  const fallback =
    status >= 500 || status === 503 ? statusFallback : contextFallback;
  if (data && typeof data === 'object' && 'message' in data) {
    const raw = (data as { message?: unknown }).message;
    if (typeof raw === 'string') {
      return sanitizeStudentFacingMessage(raw, fallback);
    }
  }
  return fallback;
}
