import { sanitizeStudentFacingMessage } from '@/lib/student-safe-errors';

/**
 * Gọi BFF Next → CRM student API cho luồng bài tập QUIZ (eligibility, đồng bộ điểm).
 * Một nơi gom URL + parse response — tránh trùng logic giữa hook quiz và component.
 */

export type QuizStartEligibilityResult =
  | { allowed: true }
  | { allowed: false; reason: string };

/**
 * GET — deadline, quizMaxAttempts (theo attempt có `assignmentId` trên Gateway).
 */
export async function fetchQuizStartEligibility(
  assignmentId: number,
): Promise<QuizStartEligibilityResult> {
  const res = await fetch(
    `/api/assignments/${assignmentId}/quiz-start-eligibility`,
    {
      credentials: 'include',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );
  const data = (await res.json().catch(() => ({}))) as {
    allowed?: boolean;
    reason?: string;
    message?: string;
  };
  if (!res.ok) {
    const msg =
      typeof data.message === 'string' && data.message
        ? data.message
        : 'Không kiểm tra được điều kiện làm bài.';
    return { allowed: false, reason: msg };
  }
  if (data.allowed === true) {
    return { allowed: true };
  }
  const reason = sanitizeStudentFacingMessage(
    typeof data.reason === 'string' ? data.reason : undefined,
    'Không được phép làm bài.',
  );
  return { allowed: false, reason };
}

/**
 * POST — sau submit attempt: đồng bộ điểm → assignment_result (GRADED). Trả `true` nếu HTTP ok.
 */
export async function postQuizResultSync(
  assignmentId: number,
  attemptPublicId: string,
): Promise<boolean> {
  const res = await fetch(`/api/assignments/${assignmentId}/quiz-result/sync`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ attemptPublicId }),
    cache: 'no-store',
  });
  return res.ok;
}
